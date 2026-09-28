# The ticket's format

`cycles/<NNN-YYYY-MM-DD>/tickets/<NN>-<step-name>.md`.

Section and field names are English; the content is Japanese.  
`止まり方:` is the one field name that stays Japanese.

## The shape

```md
# <unit-id>

Acceptance:

- <この step が満たすもの>

Owner: in the loop / at the end

止まり方: `in the loop` のときだけ。どこで止まるか。何を見せるか。何をもって終わりか: <何をもって終わりか>

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

- <機構の 1 行>: <どの仕組みが、どこで、何をするか。このリポジトリの名前ではなく、外の人が検索できる言葉で>
  - なぜ外か: <チケットの `Todo`・計画の `Files`・`Acceptance`・ユニットの `Then`・この変更が矛盾させる物、のどれにも当たらないこと>
  - 観測: <起きた回数、実測の有無、再現の手順>
  - この環境の条件: <何が守っていて、何が守っていないか>

穴が無ければ、この欄は 1 行だけ: `- なし`

### Unplanned

- <場所>: <何を変えたか>
  - なぜ: <チケットに無かったのに変えた原因>
  - なし

### Stopped

止まった step のときだけ。理由の 6 つ（親が続きをやるのに要る物）:

- 落ちた検査の出力: <落ちた検査の出力をそのまま>
- 変えたファイル: <変えたファイルのパス>
- 子の最後の本文: <子が最後に返した本文>
- 走った回数: <何回目で止まったか>
- 時刻: <止まった時刻>
- worktree の id: <残った worktree の id>
- 止まらなかった step では、この節を書かない

Commit:
```

## Owner

- `Owner:` is on every ticket, with the plan's `Owner:` value: `in the loop` or `at the end`
- `止まり方:` is on an `in the loop` ticket only, in one line
  - where it stops: this step's end, and not before
  - what it shows: the one thing the plan's `Show:` names
  - what ends it: `何をもって終わりか: …`, and the owner's call: 残す / 直す / 捨てる
- an `at the end` ticket has no `止まり方:`
- an `ex-` ticket (the `close` cuts it, and no plan step exists): `Owner: at the end`, and no `止まり方:` — it has no step to stop at

## Names

- one ticket per step, named `<NN>-<step-name>.md` with the step's number
  - `03-work-skill.owner.md`, `09-consult.retry.reject.md`
- the heading is the step's name, without the definition's number: `# work-skill.owner`
- the step's name is the plan's, and the ticket uses it as it is
  - `<unit-id>` — the unit's name, `ユニット名.機能`
  - `<unit-id>.<part>` — a split step, `ユニット名.機能.部品`。3 つ目の `部品` が `何するか`
  - `<unit-id>.check`, `<unit-id>.refactor` — いまの形のまま
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
- `Stopped`: a step that stopped, and why. The ticket is not closed: it stays open
  - the six: the output of the check that failed, the files changed, the child's last text, how many times it ran, the time, and the id of the worktree it left
  - written as it was found, and kept: not tidied or shortened
  - when the step is later finished, the reason is replaced by the unit's commit hash (the line then reads `Commit: <hash>`)
- `Commit:` is the last line, and it names the same unit's one commit
  - empty at the step's time: it is written when the unit's commit is made
- a step that changed nothing (a `<unit-id>.check`): `Commit: なし（理由）` — the reason goes in the parentheses, on the same line
- a stopped step: the commit is not made, so `Commit: なし（理由）` — the reason goes in the parentheses, on the same line

## Writing

- Do not write what the reader can look up
- No tables: they break with long text
- A field whose content cannot be written yet keeps its name and stays empty
