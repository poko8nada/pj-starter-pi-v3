# The plan's format

`cycles/<NNN-YYYY-MM-DD>/plan.md`. Section and field names are English; the content is Japanese.

## The shape

````md
# PLAN <NNN>

## Steps

### step 0: prepare

- Install: 何を入れるか。無ければ なし
- Cleanup: 何を消すか、何を動かすか。無ければ なし

### step N: <unit-id> または <unit-id>.<part>

- What:
  - いまの 1 行 → それはどうなるか
- Depends: 何を待つか
- Action: build / verify
- Files: 触るファイル
- Verify:
  - Run: その場で走るもの（コマンド、走るケース）
  - Look: 人が見る値や状態

### step N: <unit-id>.check

- What: 単位の `Then` を全部、1 回で確かめる
- Depends: その単位の最後の step
- Action: verify
- Files: なし
- Verify:
  - Run: 単位の `Then` を 1 回で確かめる実演

### step N: <unit-id>.refactor

- Why: このビルドで、構造がどう悪くなるか（1 行）
- What:
  - `Why` の 1 行 → 既存をどう直すか
- Depends: 原因になった step
- Action: build
- Files: 直すファイル（既存）
- Verify:
  - Run: 既存のテストがそのまま通ること
  - Look: 動きが変わっていないこと

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

- `lib/format.ts`: `money` と同じ値を使う
````

## Steps

- the title is `# PLAN <NNN>`, with the cycle's number
- `step 0` is always there, with `Install` and `Cleanup`, and `なし` when there is nothing
  - `なし` is written when it was looked at and nothing is needed
  - an empty field is one that is not decided yet
- the name after the colon is a unit's id, or `<unit-id>.<part>`
  - a unit that was split is closed by `<unit-id>.check`
  - `<unit-id>.refactor` is a step with no unit
- the step numbers are the order of work
- `Depends` names the step, or the steps, to wait for, or `なし`
  - the same file: the later step depends on the earlier one
  - a step that uses what an earlier step produced depends on it
  - otherwise: `なし`
- `What` is the relation: one line per `Now` line, and what it becomes
  - the number of the definition's lines is not a relation: a reader of this plan does not open the definition
  - together, the steps of a unit carry every `Now` line of it, once
- a `<unit-id>.refactor` has no gap and no `Then`
  - `Why` is what the build makes worse, and `What` is the relation
- `Action` is `build` when something is produced, and `verify` when the step only checks
  - a `<unit-id>.check` is always `verify`
- `Verify` runs when the step closes, and the step names the kinds that fit what it builds:
  - `Run` is the commands the machine runs: the cases, the types, the lint, the build
  - a condition ("no line is over 100") is not a `Run` entry
  - `Look` is what a person looks at: a value, a screen, a file, a diff
  - a component or a front end: the types and the build in `Run`, a walk in the browser in `Look`
  - a `Then` that is not a value — the quality of a document — is proved in `Look`: a child reads it and reports
  - the error paths live here: the definition leaves them out
  - a step with no error path says so in `Verify`
  - a step that moves the form is proved by the form: `Run` holds the command or the reading
- `What to keep` is a promise list: `<ファイル>: <なぜ関わるか>`
  - what this plan does not change, and a reader would still ask about
- a step that adds a check writes what it sets up for itself: the paths, the config, the environment

## Structure

- the form, not a file list: the folders nested, one line per folder with its files under it
- only the files this plan changes
- one marker per line: `add`, `update` or `drop`
- test files do not appear: they are colocated, and `Verify` names the cases
- `What to keep` is not part of it

## Writing

- Do not write what the reader can look up
- No tables: they break with long text
- A field whose content cannot be written yet keeps its name and stays empty
