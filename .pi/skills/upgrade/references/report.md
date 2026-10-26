# Report format

What `upgrade` puts in front of the owner once the out-of-range packages are found. It goes to the chat, not into a file.

## Shape

```md
# Package update report (<YYYY-MM-DD>)

## Ground

- pnpm <version> / Node <version>
- `pnpm update`: <what moved, or that nothing moved>
- `minimumReleaseAge`: <minutes>. Each target is <its age> old, so it is <the latest, or the one before>.
- `peerDependencies` are not checked: `pnpm outdated` does not see them.
- Out of range: <n>.

## List

| # | Package | Now → target | Breaking changes that hit | Files to touch | Risk |

## Each package

### <n>. `<name>` <now> → <target>

- Hits: what changed, what to change here. One line each, with its source.
- Does not hit: the count, and the largest few. One line each.
- Unknown: what only a run settles, and the run that settles it.
- Check: what closes it.
- Sources: the URLs.

## What to decide

- which packages to take
- the order to take them in
```

## Rules

- Write the hits in full. For the rest, one line for the count and one for the largest.
- An unknown says what run settles it.
- Every fact carries its URL, and the file and line it hits.
- Write a number only when it was measured.
- `pnpm outdated` exits 1 when it finds something. That is not a failure.
