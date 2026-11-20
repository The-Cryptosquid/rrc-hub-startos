# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

- Never read `rrcd.toml` or `rooms.toml` with `.const()` in `main.ts`: rrcd writes both itself
  when someone moderates from a chat client, and a reactive read would restart the hub (dropping
  everyone) on every `/kline` or `/mode`. Actions that change them call `restartHub` instead.
- Keep both of those file models `z.looseObject` with every rrcd key optional or defaulted: rrcd
  adds keys (`founder`, `last_used_ts`, `invited`) the package does not model.
- `patches/` are diffs against the `rrcd/` submodule. To change one, apply the earlier patches in
  the submodule, edit, `git -C rrcd diff` into the patch file, then `git -C rrcd checkout .` so
  the submodule stays at the pinned commit. Upstream's tests (`pytest` from `rrcd/`) should pass
  with every patch applied.
