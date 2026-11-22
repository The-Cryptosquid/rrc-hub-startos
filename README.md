<p align="center">
  <img src="icon.png" alt="RRC Hub Logo" width="21%">
</p>

# RRC Hub: Reticulum Community Channels on StartOS

> Everything not listed in this document should behave the same as upstream
> rrcd. If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable — see the Documentation
> section of `instructions.md` for links.

A Reticulum Relay Chat (RRC) hub: group chat rooms that people join over the
[Reticulum](https://reticulum.network/) network from RRC clients such as
Ratspeak (its Channels feature) and Nomad Network. The package runs
[rrcd](https://github.com/kc1awv/rrcd), the reference RRC hub daemon, with two
small patches, and manages it entirely through StartOS actions. It has no web
interface.

The alternatives are joining a hub someone else runs, or running rrcd on a
personal computer. The StartOS hub differs from them in four ways:

- **The rooms and moderation are yours.** The server's owner decides which
  rooms exist, who operates them, who is banned, and whether unknown room names
  can be founded at all.
- **The hub is always on.** It runs whenever the server does, so rooms stay
  reachable while personal computers are asleep or offline.
- **The hub address survives.** The hub identity is backed up with the rest of
  its state, so a restored hub keeps the address members already joined.
- **It shares the server's Reticulum connections.** It can reach the network
  through Nomad Network or MeshChat on the same server, and accepts direct TCP
  connections from members without any shared public server.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

The image is built by this package's `Dockerfile` from the `rrcd/` git submodule,
because upstream publishes no image. The build applies the patches in `patches/`
(see [Limitations and Differences](#limitations-and-differences)) and installs
rrcd with pip on a Python slim base.

| Item          | Value                                                         |
| ------------- | ------------------------------------------------------------- |
| Image source  | Custom `Dockerfile`, rrcd built from source with patches      |
| Architectures | x86_64, aarch64                                               |
| Entrypoint    | None; `main.ts` runs `rrc-hub-prepare`, then `rrcd`           |
| Subcontainer  | `rrcd-sub` — runs both the prepare oneshot and the hub daemon |

`rrc-hub-prepare` (`assets/rrc-hub-prepare.py`) runs before every start. It
creates the hub's Reticulum identity if it is missing, because rrcd exits after
creating any missing file, and writes the hub address derived from it to
`/data/rrcd/hub_address`. rrcd is then started with `--config`, `--identity` and
`--room-registry` pointing into `/data/rrcd/`: rrcd checks the identity and room
registry at its command-line paths before it reads the config, so all three are
passed explicitly.

## Volume and Data Layout

Two volumes: `main`, mounted in the container, and `startos`, which nothing in
the container reads.

| Volume    | Mount   | Contents                                                                                                                                                  |
| --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`    | `/data` | `rrcd/rrcd.toml`, `rrcd/rooms.toml`, `rrcd/hub_identity`, `rrcd/hub_address`, `rrcd/seen_users.json`; `rns/` (the hub's own Reticulum config and storage) |
| `startos` | none    | `store.json` — network connections: the two local-service switches and the outbound servers                                                               |

`HOME` is `/data`. There is no database and no message history: rrcd relays
messages live and stores none.

## File Models

Five files are modeled in `startos/fileModels/`. Two of them are also written by
rrcd itself, so their models keep every key they do not name.

- **`rrcd/rrcd.toml`** (TOML) — rrcd's config. Merged on every init, which
  re-asserts the keys the package fixes: `configdir`, `identity_path`,
  `room_registry_path`, `seen_users_path`, `announce_on_start = true`,
  `room_registry_prune_after_s = 0` (rooms are never pruned), and file logging
  off with console logging on. Hub Settings writes `hub_name`, `greeting`,
  `announce_period_s` and `allow_unregistered_rooms`; Manage User Permissions
  writes `trusted_identities` and `banned_identities`. rrcd also adds to
  `banned_identities` when a hub operator uses `/kline` in a client. Other hand
  edits survive, but comments do not: the package re-serializes the file.
- **`rrcd/rooms.toml`** (TOML) — the room registry: per room its topic, key,
  mode flags (`private`, `invite_only`, `moderated`, `topic_ops_only`,
  `no_outside_msgs`) and the `operators`, `voiced` and `bans` identity lists.
  Seeded empty. Written by the room actions and Manage User Permissions, and by
  rrcd when a room operator changes a room from a client (`/register`, `/mode`,
  `/topic`, `/op`, `/ban`…). Unknown keys rrcd writes (`founder`,
  `last_used_ts`, `invited`) are kept.
- **`rrcd/seen_users.json`** (JSON, read-only for the package) — written by rrcd
  (patch 0001) each time a client says HELLO: full identity hash → last
  nickname, first and last seen. Capped at the 500 most recent identities. The
  user pickers read it.
- **`rns/config`** (Reticulum config) — rendered whole by `main.ts` on every
  start from `store.json`: a TCP Server Interface on port 4242 (listening on
  `::`, IPv4 and IPv6), one TCP Client Interface (named `Nomad Network` or
  `MeshChat`) per enabled local service whose bridge address resolves, and one
  per configured server. Transport is off. Hand edits are overwritten on the
  next start.
- **`store.json`** (JSON, `startos` volume) — `nomadnet` and `meshchat`
  (booleans, the local-service switches) and `connections` (the outbound
  servers), all set by Network Connections.

`rrcd/hub_address` is written by `rrc-hub-prepare`, not modeled for writing.

## Dependencies

Two optional dependencies, each current only while its switch in Network
Connections is on. Neither mounts a volume or requires a health check; the hub
connects to the dependency's Reticulum TCP server over the StartOS bridge,
resolved with `sdk.host.getBridgeAddress` (host id `rns`, internal port 4242)
and read reactively, so installing, removing or re-addressing the dependency
restarts the hub onto the new address.

- **Nomad Network** (`nomadnet`, kind `running`) — shares Nomad Network's
  Reticulum connections. Its package enables transport by default, so the hub
  reaches everything Nomad Network is connected to.
- **MeshChat** (`reticulum-meshchat`, kind `running`) — shares MeshChat's
  Reticulum connections. MeshChat's port answers only after a TCP Server
  Interface on port 4242 is added in MeshChat, and it relays the hub's traffic
  to its other connections only if transport is enabled in MeshChat's Reticulum
  configuration; its package sets neither.

If a switch is on and the service is not installed, the hub starts without that
connection and the Services on This Server health check fails.

## Network Access and Interfaces

One interface. The hub also makes outbound TCP connections to every server
listed in Network Connections, and over the StartOS bridge to Nomad Network
and MeshChat when their switches are on.

| Interface id | Type  | Port | Protocol                    | Purpose                                                                   |
| ------------ | ----- | ---- | --------------------------- | ------------------------------------------------------------------------- |
| `rns`        | `p2p` | 4242 | Reticulum over TCP (no TLS) | Clients connect to the hub directly with a Reticulum TCP Client Interface |

RRC clients address the hub by its **hub address** (a Reticulum destination
hash shown by Hub Info), not by this TCP address. A client reaches the hub
either through a Reticulum server both are connected to, or by adding this
interface's address as a TCP Client Interface in its own Reticulum config.

## Installation and First-Run Flow

Install seeds `rrcd.toml`, an empty `rooms.toml` and `store.json`, and raises
the Create Room task. The first start creates the hub identity, which fixes the
hub address for the life of the install (and across backup and restore). With no
network connections the hub is reachable only by devices that connect to its
TCP interface directly. Nothing is exposed until the user starts the service.

## Actions

Every action that changes rrcd's files restarts the hub (`sdk.restart`), because
rrcd reads its files only at startup; Network Connections restarts it because
`main.ts` reads the connections reactively. A restart takes a few seconds and
drops every client link; clients reconnect and rejoin on their own. All actions
can run while the service is stopped, and then apply on the next start.

- **Hub Info** — read-only. Returns the hub address (copyable, with QR), rooms
  with flags and operators, hub operators, the last 20 users to connect with
  their identity hashes, and the network connections. Run it to give people the
  address or to find someone's identity hash. Before the first start there is
  no address yet.
- **Manage User Permissions** — pick a user (anyone in `seen_users.json`, plus
  anyone already named in a permission list, or enter an identity hash by hand)
  and set hub operator, hub ban, and per-room operator, voice and ban. The form
  opens prefilled with that user's current permissions and replaces them with
  what is submitted, so it is idempotent. Identity hashes are Reticulum identity
  hashes, not LXMF addresses; a wrong one fails silently in rrcd (it simply
  never matches anyone).
- **Create Room** — registers a room in `rooms.toml`. Names are trimmed and
  lowercased, as rrcd does, and limited to 64 UTF-8 bytes; an existing name is
  refused. Rooms start with no operators.
- **Edit Room** — the same settings for an existing room, prefilled. Clearing
  the topic or key removes it.
- **Delete Room** — removes the room and its permissions from `rooms.toml`.
  Disabled while there are no rooms.
- **Hub Settings** — hub name, greeting, "Only Allow Rooms I Create" (the
  inverse of `allow_unregistered_rooms`, default on), and the announce interval
  (15 min to 24 h, default 30 min).
- **Network Connections** — two switches, Connect to Nomad Network on This
  Server and Connect to MeshChat on This Server (both off by default), and the
  list of other Reticulum TCP servers the hub connects out to (empty by
  default). Turning a switch on makes that service an optional dependency; see
  [Dependencies](#dependencies). Running it with no change does not restart the
  hub.

## Tasks

- **Create Room** (`important`) — raised whenever `rooms.toml` has no rooms,
  which includes a fresh install. Running Create Room clears it; it returns if
  every room is deleted (from Delete Room or from a client with `/unregister`).
  It does not block the service.

## Health Checks

- **Reticulum TCP Server** (`rrcd` daemon) — passes when something listens on
  port 4242, which happens once rrcd has started Reticulum. Grace period 30 s.
  A failure after that means rrcd exited or is restarting: check the logs for a
  Python traceback or a Reticulum interface error. A bad Network Connections
  entry does not fail it (Reticulum keeps retrying that connection and logs it),
  and the check says nothing about whether outbound servers are reachable.
- **Services on This Server** (`local-servers`) — present only while a
  local-service switch is on. Evaluated once per start: passes naming the
  services the hub was given an address for, fails naming any that is switched
  on but not installed (install it, or turn the switch off). It does not test
  the connection itself; a stopped Nomad Network or MeshChat, or a MeshChat
  without a TCP Server Interface on port 4242, shows up only as reconnect
  attempts in the logs.

## Backups and Restore

Both volumes are copied wholesale (`ofVolumes('main', 'startos')`). That
includes the hub identity, so a restored hub keeps its address, along with its
rooms, permissions, settings, recent users and network connections. Nothing is
excluded and nothing needs rebuilding after a restore. Clients reconnect on
their own.

## Limitations and Differences

1. **Two upstream patches** (`patches/README.md` has the detail and retirement
   condition of each):
   - 0001 records every connecting user's full identity hash and nickname in
     `seen_users.json`. Upstream logs only a 12-character prefix, too short to
     name anyone in a permission list.
   - 0002 adds `allow_unregistered_rooms`. Upstream always lets anyone found a
     temporary room by joining an unknown name; with the option off (the
     package default) such joins are refused with "no such room", except from
     hub operators.
2. **Rooms are never pruned.** Upstream deletes registered rooms after 30 days
   unused; the package turns that off.
3. **No message history.** Like upstream, the hub relays live messages only;
   clients keep their own history.
4. **Changes restart the hub.** rrcd reloads files only at start (or on an
   in-chat `/reload`), so every action restarts it. If a room operator changes
   a room from a client in the second between an action's write and the
   restart, rrcd's write can overwrite that room's change from the action. Run
   the action again if a change does not appear.
5. **Single hub identity.** The hub address cannot be changed or imported; a
   reinstall without a backup creates a new address.
6. **No web interface**, no LoRa/RNode, AutoInterface or I2P interfaces: the hub
   reaches the network only over TCP.

## Quick Reference for AI Consumers

```yaml
package_id: rrc-hub
image: rrcd (built from Dockerfile, rrcd submodule + patches)
architectures: [x86_64, aarch64]
subcontainers: [rrcd-sub]
volumes:
  main: /data
  startos: none
file_models:
  - /data/rrcd/rrcd.toml
  - /data/rrcd/rooms.toml
  - /data/rrcd/seen_users.json
  - /data/rns/config
  - store.json (startos volume)
startos_managed_env_vars: none
dependencies: [nomadnet (optional), reticulum-meshchat (optional)]
interfaces:
  rns: { type: p2p, port: 4242 }
actions:
  - hub-info
  - manage-user
  - create-room
  - edit-room
  - delete-room
  - hub-settings
  - network-connections
tasks:
  - { action: create-room, severity: important }
health_checks:
  - rrcd
  - local-servers
```
