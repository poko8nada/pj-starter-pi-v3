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
- Tests: テストファイル名（コロケーションなので構成図には書かない）。形を移す step は、形の検証（コマンドか読み方）。検査を足す step は、その検査が自分で決める世界（環境・設定・置き場）も書く

### step N: <unit-id>.check

- 単位を step に割った場合の締め
- What: 単位の `Then` を全部、1 回の実演で確かめる
- Depends: その単位の step
- Action: verify
- Files: なし
- Tests: なし（実演が確かめ）

## Structure

（変えるファイルのツリー。フォルダは入れ子で書き、行の後ろに `add` / `update` / `drop`）

## Layers

（層と向き。`A は B を知らない` の形で書く）

## Seam

（差し替え点。何を交換しても他を触らずに済むか）

## What to keep

（触らないが関わるファイル。読む人が「ここも変わるのでは」と思うもの）
```

## Steps

- The title is `# PLAN <NNN>`, with the cycle's number, so it lines up with its `definition.md`
- `step 0` is always there, even when all three answers are なし
- Step numbers are the order of work, and that order is the implementation order. A step that changes a skill comes before the steps whose work that skill carries
- The name after the colon is either a unit's id or `<unit-id>.<part>`
- `0` is the only step with a fixed name: every other one is named after the thing it builds
- A step that only closes a unit (`<unit-id>.check`) has no files and no tests: the demonstration is what verifies it
- A `Tests` entry is a test file, except when the step moves the form: then it is the form's check — a command or a reading, with the expected shape in words. 「部品に色の直値が無い」「`spec` は `run` を知らない」 are that kind of entry
- A step that adds a check says what world that check declares: what it sets up for itself instead of inheriting — environment, config, paths, a server, a clock
- A step that moves the form answers the shape question: what the folder is after the file is added, or where the tidy-up is written

## Structure

- `Structure` is the form, not a file list: the folders are written nested, one line per folder with its files under it, so the shape is readable at a glance
- Only the files this plan changes. A file that is neither changed nor adjacent does not belong
- One marker per line: `add`, `update` or `drop`
- Test files do not appear here: they are colocated with the code, and `Tests` in the step already names them
- `## What to keep` is not part of `Structure`. Keeping them apart is what makes "what changed" readable at a glance

## Layers and Seam

- `Layers` and `Seam` sit next to `Structure`, and both are decisions: they are written, not derived from the code
- `Layers` is one rule with two appearances: the design layers (a value feeds the style layer, the style layer feeds the part) and the boundary layers (who may cross into whom). A front end and a back end are not two templates here
- The direction is written as `A は B を知らない`, one line per edge that must not exist; the edges that may exist are written too
- `Seam` names what can be exchanged without touching anything else. The plan must not contain a shape that breaks its own seam: when the seam moves, that is a decision, and it is written down

## Writing

- Do not write what can be derived from the code. Write decisions
- Do not wrap lines mid-sentence. One paragraph is one line
- Do not use structures that grow sideways. Tables break with long text
- The plan is frozen when it is committed. What changes later is recorded in the tickets, not here
