# Updating the upstream version

rrcd is built from source via the `rrcd/` git submodule (see `.gitmodules`) — there is no
`dockerTag` in the manifest and no pip version pin in the `Dockerfile`. The submodule commit is
the version pin. Upstream publishes no tags or releases; its version lives in
`rrcd/__init__.py` and its history in `CHANGELOG.md`.

## Determining the upstream version

- **rrcd** (`kc1awv/rrcd`, https://github.com/kc1awv/rrcd)
  ```bash
  gh api repos/kc1awv/rrcd/commits/main --jq '.sha[:7] + "  " + .commit.committer.date'
  gh api repos/kc1awv/rrcd/contents/rrcd/__init__.py --jq .content | base64 -d
  ```
  Compare against the submodule:
  ```bash
  git -C rrcd log -1 --format='%h %cI'
  grep __version__ rrcd/rrcd/__init__.py
  ```

## Applying the bump

- **rrcd** — advance the submodule to the commit that set the new `__version__` (the "update
  version" commit in upstream's history), and stage the gitlink:
  ```bash
  git -C rrcd fetch origin
  git -C rrcd checkout <commit>
  git add rrcd
  ```
  The package version in `startos/versions/current.ts` is that `__version__`.
- **Carried patches** — re-validate everything in `patches/` against the new commit:
  - Check each patch's **Retire when** condition in [patches/README.md](patches/README.md). A
    patch upstream has absorbed is deleted, along with its README section — not re-applied.
    Retiring 0001 or 0002 also means changing the code that relies on it: `seen_users_path`
    and the user pickers (0001), `allow_unregistered_rooms` and Hub Settings (0002).
  - The Dockerfile applies what remains with `patch -p1 --fuzz=0`, so a patch whose context the
    bump changed fails the build. Re-derive the patch against the new commit (or retire it) —
    never loosen `--fuzz`.
