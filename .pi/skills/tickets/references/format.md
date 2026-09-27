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
  - 合格: 段が全部あり、各フィールドの決め方が書いてある

## Notes

### Findings

- <場所>: <状態>（なぜ完遂できなかったか）。閉じるもの
  - なぜ外か: <チケットの `Todo`・計画の `Files`・`Acceptance`・ユニットの `Then`・この変更が矛盾させる物、のどれにも当たらないこと>
  - priority: high|low — <放置したときの損。high: 次の読者が間違った前提になる / 作業が壊れる / 戻せない危険 / owner に届く失敗。low: 後片付け・文言・網羅性で止まる>
  - なし

### Unplanned

- <場所>: <何を変えたか>
  - なぜ: <チケットに無かったのに変えた原因>
  - なし

Commit:
```

## Names

- one ticket per step, named `<NN>-<step-name>.md` with the step's number
  - `01-tickets-skill.md`, `02-stack-skill.md`
- the heading is the step's name, without the definition's number: `# tickets-skill`
- the step's name is the plan's
  - `<unit-id>`, `<unit-id>.<part>`, `<unit-id>.check`, `<unit-id>.refactor`
- a `step 0` that says なし takes no ticket
- a ticket the `close` cuts: `ex-<NN>-<step-name>.md`, with the next free number

## Acceptance

- the step's target, from the plan's `What`
  - the test: reading this line, does it say what must be true?
  - a relation: the right side — `商品ページで押すと、ヘッダの件数が増える`
  - a line that is already a target: as it stands — `単位の Then を全部、1 回で確かめる`

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
  - `1・4・8 行` — those three lines are in this block
- a `test` block holds the file, the command, and the cases
  - a case is `<入力> → <結果>`, marked `(happy)` or `(error)`
  - the result is a value, an error type or a state
  - "It does not throw" is not a result
  - the cases come from the `Acceptance`, not from the implementation
  - walk these, and write each case, or the reason it does not apply:
    - the happy path / null, undefined, missing / empty / boundary values
    - invalid input / the expected error path / permission / a second call / concurrency
  - the reason sits as a bullet under the artifact, in the same list as the cases
- a `read` block says what has to come back for the step to pass
  - the child's report is the evidence, and the pass line is the bar the parent judges against

## Notes

- `Findings`: what the work could not finish
  - a judgment left to someone else, or a thing it could not do, and why it stopped
  - the place, the state, and what closes it: the same three parts as the definition's `Carry over`
  - the close copies these into `Carry over`, as they were written
  - the `From: <NNN>.<ticket>` is added when the cycle closes
- `Unplanned`: a hole that was not in the ticket, and was changed here
  - the place, what changed, and why the change could not wait
  - not copied: it is closed
- both belong to whoever did the work
- `なし` is written when it was looked at and nothing is needed
- `Commit:` is the last line, and it names the same unit's one commit
  - empty at the step's time: it is written when the unit's commit is made
- a step that changed nothing (a `<unit-id>.check`): `Commit: なし（理由）` — the reason goes in the parentheses, on the same line

## Writing

- Do not write what the reader can look up
- No tables: they break with long text
- A field whose content cannot be written yet keeps its name and stays empty
