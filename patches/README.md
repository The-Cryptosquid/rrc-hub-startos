# Carried patches

Deltas applied to the `rrcd` submodule at build time, in filename order, by the
`patch -p1 --fuzz=0` step in the [Dockerfile](../Dockerfile). `--fuzz=0` is deliberate: after a
submodule bump a patch whose context has changed must fail the build, not apply anyway with the
mismatch ignored.

Each patch here forks the shipped daemon from the upstream commit the submodule names, and every
rrcd bump has to re-validate it. Both are additive and off unless their config key is set, so
upstream's own test suite passes unchanged with them applied.

## 0001 — record seen users with their full identity hash

**Retire when:** upstream records or exposes the full identity hash of connected users (in a
file, a stats command, or its logs) in a form the package can read, and the submodule is bumped
past it. Proposed upstream in [kc1awv/rrcd#19](https://github.com/kc1awv/rrcd/issues/19), with this
patch and the alternatives that would replace it.

rrcd logs only a 12-character prefix of each peer's identity hash, and keeps no record of who
has connected. Its operator and ban lists (`trusted_identities`, a room's `operators`, `voiced`,
`bans`) need the full 32-character hash, so without this an operator has to ask each user for
their identity hash — which users routinely confuse with their LXMF address, and a wrong hash
fails silently.

The patch adds a `SeenUsers` helper (`rrcd/seen.py`) and a `seen_users_path` config key. When the
key is set, every HELLO and re-HELLO records `{hash: {nick, first_seen, last_seen}}` to that JSON
file, written atomically (temp file and rename), capped at the 500 most recently seen. Unset (the
upstream default) it does nothing.

## 0002 — option to refuse joins to unregistered rooms

**Retire when:** upstream adds a setting that stops non-operators founding rooms by joining an
unknown name, and the submodule is bumped past it (then map Hub Settings onto that setting).
Proposed upstream in [kc1awv/rrcd#20](https://github.com/kc1awv/rrcd/issues/20).

rrcd lets anyone create a room by joining a name that does not exist; the room lives until it
empties. For a hub whose operator decides which rooms exist — the way Ratspeak's built-in hub
works — that is unwanted. The patch adds `allow_unregistered_rooms` (default `true`, upstream
behaviour). When `false`, a JOIN naming a room that is not in the registry is refused with
`no such room`, before any room state is created, unless the sender is in
`trusted_identities` — so hub operators can still open a room and `/register` it in-band. The
config is read with `getattr(..., True)` so code paths built on a config object without the key
(upstream's test fakes) keep the old behaviour.
