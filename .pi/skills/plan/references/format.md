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

- What: 閉じるギャップ（`<Now の行> → <Then の行>`）
- Depends: 何を待つか
- Action: build / verify
- Files: 触るファイル
- Tests: テストファイル

### step N: <unit-id>.check

- What: 単位の `Then` を全部、1 回で確かめる
- Depends: その単位の step
- Action: verify
- Files: なし
- Tests: なし

### step N: <unit-id>.refactor

- Why: このビルドで、構造がどう悪くなるか（1 行）
- What: 既存の何を、どう直すか
- Depends: 原因になった step
- Action: build
- Files: 直すファイル（既存）
- Tests: 既存のテストがそのまま通ること

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

An example of a refactor step:

```md
### step 1: login.refactor

- Why: `login` が `user.ts` に認証を持ち込むので、`user.ts` が表示と認証の 2 つを指すようになる
- What: `src/lib/user.ts` を `auth.ts` と `user-view.ts` に割る
- Depends: step 3
- Action: build
- Files: `src/lib/user.ts`, `src/lib/auth.ts`, `src/lib/user-view.ts`
- Tests: `user.ts` の既存のテストがそのまま通ること
```

## Steps

- the title is `# PLAN <NNN>`, with the cycle's number
- `step 0` is always there, with `Install` and `Cleanup`, and `なし` when there is nothing
- the name after the colon is a unit's id, or `<unit-id>.<part>`
  - a step with no unit adds a suffix: `<unit-id>.check` or `<unit-id>.refactor`
- a `<unit-id>.refactor` has no gap and no `Then`
  - its `Tests` is what shows that the behaviour did not change
- `Why` names what the build makes worse: the structure, a dependency or a layer
- the step numbers are the order of work
- a `<unit-id>.check` step has no files and no tests: its `What` is the proof
- `Action` is `build` when something is produced, and `verify` when the step only checks
  - a `<unit-id>.check` is always `verify`
- a `Tests` entry is a test file, except when the step moves the form
  - then it is the command or the reading that shows the new form
- a step that adds a check writes what it sets up for itself: the paths, the config, the environment

## Structure

- the form, not a file list: the folders nested, one line per folder with its files under it
- only the files this plan changes
- one marker per line: `add`, `update` or `drop`
- test files do not appear: they are colocated, and `Tests` names them
- `What to keep` is not part of it

## Writing

- Do not write what the reader can look up
- No tables: they break with long text
- A field whose content cannot be written yet keeps its name and stays empty
