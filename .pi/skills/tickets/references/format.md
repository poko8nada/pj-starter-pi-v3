# The ticket's format

`cycles/<NNN-YYYY-MM-DD>/tickets/<NN>-<step-name>.md`.

Section and field names are English; the content is Japanese.

## The shape

```md
# <step 名>

Acceptance:

- <この step が満たすもの>

## Todo

- <ファイル>
  - <その中の単位> — 一言（文書 = 見出し / コード = 関数）
  - <テストファイル>
    - <入力> → <結果>（happy / error）

## Verify

- Run: <その場で走るコマンド>
- Look: <人が見る値や状態>

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
```

## Names

- one ticket per step, named `<NN>-<step-name>.md` with the step's number
  - `01-tickets-skill.md`, `08-stack-skill.md`
- the heading is the step's name
  - a unit's id, or `<unit-id>.<part>`
  - a step with no unit: `<unit-id>.check` or `<unit-id>.refactor`
- a `step 0` that says なし takes no ticket

## Acceptance

- the step's target: the right side of the plan's `What`, copied

## Todo

- by artifact: a file, then the units inside it, then its tests
- a document is split by heading, code by function, tests by case
- every file in the step's `Files` appears
- a step with no files writes なし, and says why
- a step with no behaviour writes なし for the tests, and says why

## Verify

- the step's `Verify` from the plan: `Run` is the command, `Look` is what a person reads
  - the cases, the types, the lint, the build go in `Run`
- the error paths live in the tests, and `Verify` names the run that shows them
- it runs the moment the step closes, not later
- a step that moves the form is proved by the form

## Notes

- `Findings` and `Unplanned` belong to whoever did the work
- `なし` is written when it was looked at and nothing is needed
- `Commit:` is the last line, and it stays empty until the step is done

## Writing

- Do not write what the reader can look up
- No tables: they break with long text
- A field whose content cannot be written yet keeps its name and stays empty
