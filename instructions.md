# RRC Hub: Reticulum Community Channels

## Documentation

- [rrcd README](https://github.com/kc1awv/rrcd/blob/main/README.md) — the hub daemon this service runs: room modes and the chat commands operators can use.
- [RRC specification](https://rrc.kc1awv.net/*) — the Reticulum Relay Chat protocol that clients and hubs speak.

## What you get on StartOS

A channel hub that is always on: group chat rooms people join from Ratspeak
(Channels), Nomad Network or any other RRC client. You run it entirely from the
service's actions: create rooms, choose who can moderate them, and ban people.
There is no web page to open.

The hub only relays messages while people are connected. It keeps no chat
history; each person's app keeps their own.

## Getting set up

1. Start the service, then run **Create Room** (a task reminds you). Add a
   topic, and a **Room Key** if the room should need a password.
2. Run **Network Connections** to choose how the hub reaches the Reticulum
   network:
   - Turn on **Connect to Nomad Network on This Server** and/or **Connect to
     MeshChat on This Server** to share the connections those services already
     have. MeshChat needs a TCP Server Interface on port 4242 added in MeshChat,
     and each service must have transport enabled to pass the hub's traffic on
     to its other connections (Nomad Network has it on by default).
   - Or add another Reticulum server under **Reticulum Servers**, such as a
     public transport node (`host` and port, usually `4242`).

   Skip this if everyone will connect to the hub directly (see below).

3. Run **Hub Info** and share the **Hub Address** (copy it or show the QR
   code). In Ratspeak, people add it under **Channels**.
4. Connect from your own app once, then run **Manage User Permissions**, pick
   yourself from the list, and turn on **Hub Operator** and **Room Operator In**
   for your rooms.

### Connecting directly

The **Reticulum TCP Server** interface lets a phone or computer connect to the
hub without any shared server: add its address as a **TCP Client Interface** in
the app's Reticulum or network settings, then join with the hub address as
usual.

If you publish this service through a tunnel to keep your home IP private, send
its outbound traffic through that tunnel too. Otherwise the Reticulum servers
you add under **Reticulum Servers** see your home IP. If you use a tunnel for
another reason, there is nothing to change.

## Using RRC Hub

Every change you make with an action restarts the hub. Everyone is disconnected
for a few seconds and their apps reconnect on their own.

### Actions

- **Hub Info** — the hub address to share, your rooms and their operators, hub
  operators, the last 20 people to connect, and your network connections.
- **Manage User Permissions** — pick someone and choose what they can do:
  - **Hub Operator**: can run admin commands such as `/stats` and `/kline` from
    their chat app.
  - **Banned From the Hub**: is disconnected whenever they connect.
  - **Room Operator In**: can moderate those rooms (topic, modes, invites,
    kicks and bans) from their chat app, and join them without the key.
  - **Voice In**: can talk in those rooms while they are **Moderated**.
  - **Banned From Rooms**: cannot join those rooms.

  People appear in the list after they connect to the hub once. For someone who
  hasn't connected yet, choose **Someone else** and enter their Reticulum
  identity hash: 32 hexadecimal characters. That is not their LXMF (messaging)
  address.

- **Create Room**, **Edit Room**, **Delete Room** — manage rooms and their
  settings:
  - **Hidden**: the room is left out of the room list.
  - **Invite Only**: only operators and people they `/invite` can join.
  - **Moderated**: only operators and people with voice can talk.
  - **Members Only**: only people in the room can send messages to it.
- **Hub Settings** — the hub's name, a greeting shown to everyone who connects,
  how often the hub announces itself on the network, and **Only Allow Rooms I
  Create**. When that setting is off, anyone can open a temporary room by
  joining a name that doesn't exist.
- **Network Connections** — share the connections of Nomad Network or MeshChat
  on this server, and add other Reticulum servers the hub connects to.

Room operators can also change rooms from their chat app (for example `/topic`,
`/mode`, `/op`, `/ban`). Those changes are kept, and the actions show them.
