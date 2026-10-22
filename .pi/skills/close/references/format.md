# Close format

`cycles/<YYMMDD>-<NNN>-<slug>/close.md`, in the shape below. It is the cycle's last word.

## Shape

```md
# Close <NNN>

## Collected

### <plan id> (ADR <プランの No の値>)

1. <plan id>:<line> / <place> / <穴>
   - Doing: <その時 plan がしていた事>
   - Left: <なぜ残したか>
   - Cost: <放っておくと何が困るか>

## Triage

- <N>: ex-plan <plan id> (<定義の部分>): <why>
- <N>: proposed (<定義の部分>): <why>
- <N>: dropped (<定義の部分>): <why>
```

## Collected

- The script writes this section: `node .pi/skills/close/scripts/collect.mjs cycles/<YYMMDD>-<NNN>-<slug>`. It writes `close.md` itself, and creates the file when it is not there.
- One leftover is one numbered line and three bullets. The line is `<line> / <place> / <穴>`: the line in the plan md (the heading above names the plan), and where the hole came from (`Slice 1 (名前)`, `Review Round 1`, `Acceptance`).
- The agent writes the bullets, reading the plan md and the diff. `Doing` is what the plan was doing there, `Left` is why the hole was left, `Cost` is what it costs to leave it. They are what the owner judges with, so they name the line and the code, and do not restate the plan.
- The script touches nothing that is indented deeper than a numbered line. The bullets stay when it runs again.
- A hole the script cannot see — a change an entry decided that no plan carries — is added by the agent as a numbered line, in the same shape, after every run of the script.
- The heading of a plan carries the `No` of its plan md. `未特定` when the plan md has no `No` (an `ex-` plan, or a plan written by hand). Fill it before showing the owner.
- The numbering runs through the whole file. A plan with no leftover is not listed.
- `なし` when there is none.
- The order is the design's plans first (by file name), the `ex-` plans after (by file name), so adding an `ex-` plan does not move the numbers above it.

## Triage

- One line per leftover: its number, where it goes, the part of the definition it belongs to, and why. The part is the `ADR` entry and the part of `DEFINITION.md` the leftover lands on.
- `ex-plan <plan id>` — it is one of four: a contradiction, a hole, something broken, something left stale. The plan is named `ex-<what it fixes>`, and it has no design. It fixes code only: a leftover that moves a part of `DEFINITION.md` goes to `proposed`.
- `proposed` — it breaks nothing, but leaving it makes things worse. The next cycle carries it: its ADR decides, and a plan writes.
- `dropped` — rare, and the fix weighs more.
- `done <commit>` — the `ex-` plan has merged, and this is its merge commit.
- `なし` when there is none.

## Closing

- Every leftover has a line in the `Triage`: nothing is left without a destination.
- Every `ex-` plan is merged, and its line carries `done <commit>`.
- Then the cycle is closed: `close.md` and the `ex-` plans go in one commit, and nothing about the cycle is edited afterwards.

## Writing

- A file name is written from the project root.
- Do not write what the reader can look up: name the plan and the place.
