# PLAN `01-adr`

- No: 01, 02, 04, 06
- Place: base
- Boundary Plans: なし

## Design

- Inside:
  - Modules: なし。`adr.mjs` と `affected.mjs` は、ADR用と affected 用の別の骨組みであり、形も対象も違う。`adr.format.md` と `options.md` は、前者は記録の形を定め、後者は提示の形を定めるもので、役割が違う。`adr/SKILL.md` の手順 3・4・6は選択肢の提示であり、手順 7は調査の手順である。いずれも1つの文書の中の別のセクションであり、これらは統合も分割もしない。
  - Dirs: なし。`references/` に `options.md` が増えるだけであり、ディレクトリの統合・分割・移動はない。
- Outside:
  - Extract: なし。`adr/SKILL.md` と `plan/SKILL.md` の共通化は、作業が2つのスキルにまたがるため、このプランでは扱わない。3つの骨組みは形が違うため、共通化は成り立たない。
  - Colocate: なし。

## Files

```text
.pi/skills/adr/
  SKILL.md                 update
  scripts/
    adr.mjs                update
    affected.mjs           update
    cycle.mjs
    index.mjs              update
    index.test.ts          update
  references/
    adr.format.md          update
    affected.format.md     update
    options.md             add
    tasks.md               update
.pi/extensions/consult/
  types.json               update
  README.md                update
cycles/261105-055-feat-update-affected/
  affected.md              update
```

## Slices

## 1.選択肢の提示

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/references/options.md`:
   - add: 選択肢の提示の型と規則を定める新しい文書を作る。
     ```md
     # Options

     The chat presents the options; `adr.format.md` holds how they are written to the ADR.
     One option is a way the entry's intent is met: two to four of them, named A, B, C in order.

     ## Option <A>

     <what this option does, in one sentence>

     ### Add

     - <what grows: a file, a heading, a value. `なし` when nothing>

     ### Update

     - <what changes: what becomes what>

     ### Drop

     - <what disappears>

     ### Keep

     - <what is not touched, and why. `なし` when nothing>

     ### Cost

     - <the relative cost against the other options: what is higher, what is lower>

     One option is one block, in one fence. A line says what becomes what.
     A field with nothing in it is `なし`; do not leave it out.
     ```
2. `.pi/skills/adr/references/adr.format.md`:
   - update: `Decision` の `Adopted` と `Options` を、4つの操作（Add／Update／Drop／Keep）と `Cost` の形にする。
     ```md
     ### Decision

     - Status: **accepted** | **rejected**（理由）
     - Adopted:
       - <A>: <説明>
         - Add:
           - <増えるもの>
         - Update:
           - <変わるもの。何がどうなるか>
         - Drop:
           - <消えるもの>
         - Keep:
           - <触らないもの。理由>
         - Cost:
           - <他の選択肢との相対評価>
     - Options:
       - <B>: <説明> - <採用しなかった理由>
     ```
3. `.pi/skills/adr/scripts/adr.mjs`:
   - update: `adrSkeleton` の `Decision` の骨組みに、`Add` / `Update` / `Drop` / `Keep` / `Cost` を加える。
4. `.pi/skills/adr/scripts/index.test.ts`:
   - update: `adrSkeleton` の `Decision` のアサーションを、`Add` / `Update` / `Drop` / `Keep` / `Cost` に合わせる。
     - update: (happy) `adrSkeleton(1)` を呼び出して書くと、`Adopted` の下に `Add` / `Update` / `Drop` / `Keep` / `Cost` が並ぶ
     - update: (error) `Decision` の見出しを削って書くと、検査が赤になる
     - add: (empty) `Options` に案がないときは、`Add` などの項目は出ず、`Status` だけが出る
5. `.pi/skills/adr/SKILL.md`:
   - update: 手順 3（Options）・4（Discussion）・6（Write）について、`references/options.md` を指すように書き直す。散文の「何を得て、何をコストし、どこで成り立たないか」を、選択肢の記述から落とす。手順 3 は `references/options.md` の型で提示し、手順 6 は `adr.format.md` の形で書く。

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr/scripts/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `Add`、`Update`、`Drop`、`Keep`、`Cost`、`options.md`、`何を得て` を、大小文字を問わず検索する
  - 変えた5つのファイル（`options.md`、`adr.format.md`、`adr.mjs`、`index.test.ts`、`SKILL.md`）を、変える前と並べて読む
- Added:
  - a `base` plan's look — オーナーがスライスの変更を読み、OK がスライスを閉じる

## 2.affected の形

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/references/affected.format.md`:
   - update: `### Code` をパスごとの `- Path:` / `Kind:` / `Edge:` のブロックにする。`### External` を `- Name:` / `Kind:` / `Used by:` にする。`Search`、`Adr`、`Direction`、`Relation`、`Role`、`Role change`、`Adjustment` を落とす。外に何もないときは `なし` と書く。導き出せなかった事実は記録には書かず、報告に書く。
     ```md
     ### Code

     - Path: `<パス>`
       - Kind: `module` | `test` | `doc` | `config` | `artifact` | `dir`
       - Edge: `needs` | `names` | `mentions` | `checks` | `contains` `<パス>`

     ### External

     - Name: `<外のもの>`
       - Kind: `env` | `contract` | `data` | `path` | `limit`
       - Used by: `<それを使うパス>`
     ```
2. `.pi/skills/adr/scripts/affected.mjs`:
   - update: `affectedEntrySkeleton` を、前項のブロックの形にする。
3. `.pi/skills/adr/scripts/index.test.ts`:
   - update: `affectedEntrySkeleton` のアサーションを、前項のブロックの形に合わせる。
     - update: (happy) `affectedEntrySkeleton(1)` を呼び出して書くと、`Path` / `Kind` / `Edge` と `Name` / `Used by` が並ぶ
     - update: (error) `Kind` の行を削って書くと、検査が赤になる
     - add: (empty) 外に何もないときは、`### External` の下に `なし` が出る
4. `cycles/261105-055-feat-update-affected/affected.md`:
   - update: `## 01:` の11のパスを、前項のブロックの形に書き直す。`## 02:` から `## 05:` は、旧形のまま残す（変更前に決まったエントリーの記録であり、このプランの対象ではない）。
5. `.pi/skills/adr/references/tasks.md`:
   - update: 51 行目の `seven bullets` を、新しい形を示す文に変える。

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr/scripts/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `Path:`、`Kind:`、`Edge:`、`Used by:`、`seven bullets`、`Role change`、`Adjustment` を、大小文字を問わず検索する
  - 変えた4つのファイル（`affected.format.md`、`affected.mjs`、`index.test.ts`、`cycles/.../affected.md`）と `tasks.md` を、変える前と並べて読む
- Added:
  - a `base` plan's look — オーナーがスライスの変更を読み、OK がスライスを閉じる
  - a proofread — `cycles/261105-055-feat-update-affected/affected.md` の `## 01:`（このスライスが変える日本語の文書）

## 3.調査の手順と道具

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/references/tasks.md`:
   - update: `## Look at the affected` を、次の手順に書き直す。`## How to look` の11項目と `## What to answer` の9項目を落とす。検索名ごとに範囲を書く形と、前方と後方に分ける表現も落とす。
     ```md
     ## Look at the affected

     The change is the entry's decision. The record is `affected.md`; its shape is entry 02's.

     1. Read the entry in full: `Context`, `Scope`, `Adopted`, `Definition`.
     2. Take the objects: for each kind in the `Scope`'s `in`, for each sentence of the `Adopted`, take the verbs (remove, drop, replace, rewrite, add, move, merge, retire) and their objects. Split a sentence with two operations; a sentence that states a result is an operation.
     3. Sort the nouns into paths, directories, headings, keys, identifiers, strings, sentences, commands and abstracts. Fix an abstract on the file the entry names; an abstract that cannot be fixed is returned as a fact.
     4. Widen each to five spellings: the full path, the parent directory, the last element, the identifier, the URL fragment.
     5. The range is the whole repository, always.
     6. Search every name as a string first, with `git grep`; a path is no exception. `git ls-files` and `find` only answer whether it exists. A heading is `grep '^#\{1,6\} '`; a key is a `grep` of the config; a sentence is a `read`; a command is the `scripts` of `package.json`.
     7. Exclude `cycles/` records, `node_modules` and generated files by kind, never by count.
     8. A hit is a candidate: read it before deciding the item. A string match is not a dependency.
     9. For each object, check the seven effects: breaks, loses its target, becomes a lie, stops checking, stays in the generated, needs a registration, changes the outside contract.
     10. Fill the worksheet: per object, the five spellings' hits and the seven effects, no blank. A blank means the search is not done. Fill a cell with the `git grep` result, not with `ls` or `find`. Every path in the worksheet is a `Path`; a `Path` is not added beyond the worksheet. The worksheet goes to the report, not the record.
     11. An edge: a file a search cell hit is a `names` / `mentions` / `needs` edge.
     12. Repeat: add the names the hits give (the file, the parent directory, the identifier, the nearby heading) until no new name comes.
     13. Stop when no new name comes and the worksheet has no blank.
     14. The agent checks the worksheet: a cell filled by `ls` or `find` alone is not accepted.
     15. Check that each kind in the `Scope`'s `in` has at least one operation; if not, the extraction is not done. The object list goes to the report before the search.
     16. The reflection: the ranges seen, the ranges not seen and why, the names added. The questions that could not be answered, the nouns that could not be derived and the reason the work stopped go to the report as facts.
     17. The constraints: the change is not applied, so the checks are not run. No indexer, AST or LLM. The cost follows the change's size; no full enumeration.
     18. The policy: add `bash` to `.pi/extensions/consult/types.json`'s `research` tools; `bash` is `["git grep", "git ls-files", "git log", "rg"]`; no writing command and no `--run`.
     ```
2. `.pi/skills/adr/SKILL.md`:
   - update: 手順 7 の「規則と食い違っている1文」を、`references/tasks.md` の手順を示す文に変える。
3. `.pi/extensions/consult/types.json`:
   - update: `research` の `tools` に `bash` を足し、`bash` をプレフィックスの配列にする。ほかのツールは落とさない。
     ```json
     "tools": [
       "read",
       "ls",
       "find",
       "grep",
       "web_search",
       "fetch_content",
       "edit",
       "quick_edit",
       "target_edit",
       "write",
       "bash"
     ],
     "bash": ["git grep", "git ls-files", "git log", "rg"],
     ```
4. `.pi/extensions/consult/README.md`:
   - update: `research` が `bash` を使えることと、プレフィックスの一覧を同じファイルに書く。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult .pi/skills/adr`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `How to look`、`What to answer`、`seven bullets`、`git grep`、`git ls-files`、`Look at the affected` を、大小文字を問わず検索する
  - 変えた4つのファイル（`tasks.md`、`SKILL.md`、`types.json`、`README.md`）を、変える前と並べて読む
- Added:
  - a `base` plan's look — オーナーがスライスの変更を読み、OK がスライスを閉じる
  - other — `node -e` を使わず、`types.json` を `read` で読み、`research` の `bash` が4つの接頭辞を持つことを確かめる

## 4.記録の形

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/references/adr.format.md`:
   - update: `Context` の項目に `C<n>`、`Research & Trial` の事実に `F<n> (C<n>)`、選択肢の各行に `（C*, F*）` を付け、`Decision` の `Status` に空の状態を足し、`Options` を決定の後は1行に縮める。
     ```md
     ### Context

     - C1: <前提。いまの振る舞い>
     - C2: <制約。Who の要望、上限、変えないと決めたこと>

     ### Research & Trial

     - F1 (C1): <事実>。出所。

     ### Decision

     - Status: <決定の前は空。`accepted` | `rejected`（理由）>
     - Adopted:
       - <A>: <説明>
         - Add:
           - <何が増えるか>（C1, F2）
     - Options:
       - <B>: <説明> - <その選択肢を採用しなかった理由>
     ```
2. `.pi/skills/adr/references/options.md`:
   - update: 選択肢を、`Context` の `C` と `Research & Trial` の `F` を満たすものだけにし、各行に `（C*, F*）` を付ける規則を足す。

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `C<n>`、`F<n>`、`（C`、`Status` の空の状態を、大小文字を問わず検索する
  - 変えた2つのファイル（`adr.format.md`、`options.md`）を、変える前と並べて読む
- Added:
  - a `base` plan's look — オーナーがスライスの変更を読み、OK がスライスを閉じる

## 5.骨組みと検査

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/scripts/adr.mjs`:
   - update: 骨組みに `C`、`F`、`Status` の空、選択肢の参照を足す。純粋な関数 `checkEntry(markdown)` を足し、抜けの一覧を返す。
2. `.pi/skills/adr/scripts/index.mjs`:
   - update: `--check` を足す。`adr.md` を読み、抜けを出し、抜けがあれば終了コード1で終える。
3. `.pi/skills/adr/scripts/index.test.ts`:
   - update: 骨組みのアサーションを新しい形にし、`checkEntry` のテスト（正常系、`C` の抜け、`F` の参照なし、未知の番号、重複の場合）を足す。
     - add: (happy) すべての `C` と `F` を参照する選択肢 → 抜けは空
     - add: (error) `C2` を参照しない選択肢 → `C2` を抜けとして返す
     - add: (error) どの選択肢も参照しない `F3` → `F3` を抜けとして返す
     - add: (error) `C9` への参照 → 未知の番号として返す
     - add: (empty) `Context` の項目がない → 抜けは空

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr/scripts/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `checkEntry`、`--check` を、大小文字を問わず検索する
  - 変えた3つのファイル（`adr.mjs`、`index.mjs`、`index.test.ts`）を、変える前と並べて読む
- Added:
  - a `base` plan's look — オーナーがスライスの変更を読み、OK がスライスを閉じる

## 6.エントリーの流れ

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/SKILL.md`:
   - update: エントリーの手順を、12段の流れに書き直す。`Scope` をチャットで合意し、骨組みを作り `Scope` と `Context` を書く。調査を合意し、先に議論する。調査と議論のループで `Context` と `Research & Trial` を足し、必要なら `Scope` を提案して変える。オーナーが求めたら選択肢を作り、`Decision` に `Status` 空で書く。`--check` を走らせ、決定し、`Definition` を書き、オーナーの確認を受ける。校正と `Affected` は、その間に次のエントリーへ進む。

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `Context`、`Research & Trial`、`Deferred`、`--check`、`Scope` を、大小文字を問わず検索する
  - `.pi/skills/adr/SKILL.md` を、変える前と並べて読む
- Added:
  - a `base` plan's look — オーナーがスライスの変更を読み、OK がスライスを閉じる

## Notes

### Slice 1: 選択肢の提示

- Findings: なし
- Unplanned: `adr.mjs` の骨組みの語を、`adr.format.md` の語に揃えた（proofread の後に、私が行った）
- Commit: `bf3039f`
- Stopped: なし

### Slice 2: affected の形

- Findings: なし
- Unplanned: `tasks.md:51` の `seven bullets` は、変えていない。スライス3 が `## Look it up` のタスク文を全体で書き直すので、そこで消える
- Commit: `f669211`
- Stopped: なし

### Slice 3: 調査の手順と道具

- Findings: なし
- Unplanned: なし
- Commit: `4752f3e`
- Stopped: なし

### Slice 4: 記録の形

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 5: 骨組みと検査

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 6: エントリーの流れ

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
