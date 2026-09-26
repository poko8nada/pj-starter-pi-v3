# The ticket's format

`cycles/<NNN-YYYY-MM-DD>/tickets/<NN>-<step-name>.md`.

Section and field names are English; the content is Japanese.

## The shape

```md
# <unit-id>

Acceptance:

- <この step が満たすもの>

## Todo

- <ファイル>
  - <その中の単位> — 一言（文書 = 見出し / コード = 関数）
  - <テストファイル>
    - <入力> → <結果>（happy / error）

## Verify

### test

- `pnpm test login`（8 ケース）
  - 正しいメールとパスワード → ホームに着く（happy）
  - パスワードが違う → `401` が返る（error）

### read

- `review` の子に `.pi/skills/stack/SKILL.md` だけを渡す
  - 手順どおりに `Stack` が書けるか報告させる

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
```

## Names

- one ticket per step, named `<NN>-<step-name>.md` with the step's number
  - `01-tickets-skill.md`, `02-stack-skill.md`
- the heading is the unit's id, without the definition's number: `# tickets-skill`
  - a step with no unit: `<unit-id>.check` or `<unit-id>.refactor`
- a `step 0` that says なし takes no ticket

## Acceptance

- the right side of the plan's `What`, copied

## Todo

- the concrete work, by artifact
  - a document: the headings, and what changes in each
  - code: the functions to write or change
  - a refactor: what is split, moved or dropped
- the test files are here, with their paths: the plan does not name them
- every file in the step's `Files` appears
- a step with no files writes なし, and says why

## Verify

- one block per type the plan named
- the types, and what each block holds, are in the plan's `format.md`
- together, the blocks decide every `Acceptance` line, and each block says which lines it decides
- a `test` block holds the file and the cases
  - a case is `<入力> → <結果>`, marked `(happy)` or `(error)`
  - the reason a category does not apply is a bullet under the artifact
    - in the same list as the cases
- the run happens when the step closes, not later

## Notes

- `Findings` and `Unplanned` belong to whoever did the work
- `なし` is written when it was looked at and nothing is needed
- `Commit:` is the last line, and it stays empty until the step is done

## Writing

- Do not write what the reader can look up
- No tables: they break with long text
- A field whose content cannot be written yet keeps its name and stays empty
