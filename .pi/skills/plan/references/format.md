# The plan's format

Section and field names are English. They are the type: the same in every plan, and fixed.

**The content is Japanese.** The owner reads these plans, and the project's rule is that documents a person reads are written in Japanese. So the placeholders below are in Japanese on purpose: they show the language the content goes in, not the labels.

## The shape

```md
# PLAN <NNN>

## Steps

### step 0: prepare

- Install: 何を入れるか
- Cleanup: 何を消すか（依存の削除、不要になったファイル）
- Refactor: 先に直す構造。無くても「なし」と書く

### step N: <unit-id> または <unit-id>.<part>

- What: 何をするか（1 行）
- Depends: 何を待つか
- Action: verify / build
- Files: 具体的なファイル名
- Tests: テストファイル名（コロケーションなので構成図には書かない）

### step N: <unit-id>.check

- 単位を step に割った場合の締め
- What: 単位の `Then` を全部、1 回の実演で確かめる
- Depends: その単位の step
- Action: verify
- Files: なし
- Tests: なし（実演が確かめ）

## Structure

（変えるファイルのツリー。行の後ろに `add` / `update` / `drop`）

## What to keep

（触らないが関わるファイル。読む人が「ここも変わるのでは」と思うもの）
```

## Steps

- The title is `# PLAN <NNN>`, with the cycle's number, so it lines up with its `definition.md`
- `step 0` is always there, even when all three answers are なし
- Step numbers are the order of work. The name after the colon is either a unit's id or `<unit-id>.<part>`
- `0` is the only step with a fixed name: every other one is named after the thing it builds
- A step that only closes a unit (`<unit-id>.check`) has no files and no tests: the demonstration is what verifies it

## Structure

- Only the files this plan changes. A file that is neither changed nor adjacent does not belong
- One marker per line: `add`, `update` or `drop`
- Test files do not appear here: they are colocated with the code, and `Tests` in the step already names them
- `## What to keep` is not part of `Structure`. Keeping them apart is what makes "what changed" readable at a glance

## Writing

- Do not write what can be derived from the code. Write decisions
- Do not wrap lines mid-sentence. One paragraph is one line
- Do not use structures that grow sideways. Tables break with long text
- The plan is frozen when it is committed. What changes later is recorded in the tickets, not here
