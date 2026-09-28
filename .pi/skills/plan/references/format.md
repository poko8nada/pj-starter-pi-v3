# The plan's format

`cycles/<NNN-YYYY-MM-DD>/plan.md`.

Section and field names are English; the content is Japanese.

## The shape

````md
# PLAN <NNN>

## Steps

### step 0: prepare

- Owner: at the end
- Install: 何を入れるか。無ければ なし
- Cleanup: 何を消すか、何を動かすか。無ければ なし

### step N: <unit-id> または <unit-id>.<part>

- Owner: in the loop / at the end
- What:
  - いまの 1 行 → それはどうなるか
- Show: `in the loop` のときだけ。何を 1 つ見せるか（起動する・画面を撮る・差分を見せる）
- Depends: 何を待つか
- Action: build / verify
- Files: 触るファイル。テストは書かない。調べた依存先（この step が変える物を語っている文書・コメント・テスト）も入れる
- Verify: <型>

### step N: <unit-id>.check

- Owner: in the loop / at the end
- What: 単位の `Then` を全部、1 回で確かめる
- Show: `in the loop` のときだけ、何を 1 つ見せるか
- Depends: その単位の最後の step
- Action: verify
- Files: なし
- Verify: <型>

### step N: <unit-id>.refactor

- Owner: in the loop / at the end
- Why: このビルドで、構造がどう悪くなるか（1 行）
- What:
  - `Why` の 1 行 → 既存をどう直すか
- Show: `in the loop` のときだけ、何を 1 つ見せるか
- Depends: 原因になった step
- Action: build
- Files: 直すファイル（既存）
- Verify: <型>

## Structure

```text
src/
  features/
    cart/
      CartButton.tsx   add
      useCart.ts       add
  lib/
    money.ts           update
  old/
    cart.ts            drop
```

## What to keep

- なし
````

## The Verify types

For each type, what the ticket holds:

- `test`: a machine runs the tests, and reads the pass or the fail
  - the file, the command, and the cases
- `api`: a request is sent to the interface, and the response is read
  - the request, and the response that is expected
- `browser`: a person walks the screens, and reports what was seen
  - the URL, the steps, and what is seen
- `visual`: a screenshot of the screens is compared against the agreed look
  - the screen, and the look
- `compat`: the same walk on another browser or width
  - which browser or width
- `a11y`: the screens are walked with a screen reader
  - or the tree, the contrast and the labels are checked
  - the screen, and what is walked or checked
- `cli`: a command is run, and its output is read
  - the command, and the output that is expected
- `perf`: a machine reads the time or the load of the product while it runs
  - what is measured, and the number
- `data`: rows are written into the store and read back, and a migration runs forward and back
  - the rows, the store, and the migration
- `security`: a request that should be refused is sent, and the refusal is read
  - the request, and the refusal
- `form`: a machine checks the length, the counts, or compares two files
  - the files, the command, and the number
- `read`: a child reads a document and reports
  - which child, which document, and what it reports
- `use`: a child uses the document, and reports
  - which child, which document, and what it does with it
- `look`: a person reads a value: a screen, a log, a DB, a file
  - where the value is read, and what it should be

## Steps

- the title is `# PLAN <NNN>`, with the cycle's number
- `step 0` is always there, with `Install` and `Cleanup`, and `なし` when there is nothing
  - `なし` is written when it was looked at and nothing is needed
  - an empty field is one that is not decided yet
- every step has an `Owner:` line, `step 0` included: `in the loop` or `at the end`
  - a step takes the value of the unit in its name; `step 0` takes `at the end`
  - the value is the owner's, proposed per unit when the plan is made
    - the default proposal is `at the end`
    - a value decided before the plan is written is used as it is
- the name after the colon is a unit's id, or `<unit-id>.<part>`
  - a unit that was split is closed by `<unit-id>.check`
  - `<unit-id>.refactor` is a step with no unit
- the step numbers are the order of work
- `Depends` names the step, or the steps, to wait for, or `なし`
- `What` is the relation: one line per `Now` line, and what it becomes
  - the number of the definition's lines is not a relation
    - a reader of this plan does not open the definition
  - together, the steps of a unit carry every `Now` line of it, once
- an `in the loop` step has a `Show:` line, and an `at the end` step has none
  - it names the one thing to show, and how: 起動する・画面を撮る・差分を見せる
- an `in the loop` unit is cut into vertical slices
  - 「見せられる大きさ」: 1 つの操作が端から端まで動き、owner が見て 1 つの判断（残す / 直す / 捨てる）を下せる。見せる物は 1 つ
  - 内部だけの step（列を足す、設定を変える、リファクタ）は単独にせず、見せられる切片に付ける
- a `<unit-id>.refactor` has no gap and no `Then`
  - `Why` is what the build makes worse, and `What` is the relation
- `Action` is `build` when something is produced, and `verify` when the step only checks
  - a `<unit-id>.check` is always `verify`
- `Verify` is the types that decide every line of `What`, from the list above
  - a document's lines need `read`, `use` or `form`
  - the tests are the ticket's: no case is written here
  - a step that moves the form is proved by the form
- a step that adds a check writes what it sets up for itself: the paths, the config

## Structure

- the form, not a file list: the folders nested, one line per folder with its files under it
- only the files this plan changes
- one marker per line: `add`, `update` or `drop`
- test files do not appear: the ticket decides them
- `What to keep` is not part of it

## Writing

- Do not write what the reader can look up
- No tables: they break with long text
- A field whose content cannot be written yet keeps its name and stays empty
