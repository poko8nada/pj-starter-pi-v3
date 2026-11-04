# PLAN `ex-close-skill`

- Place: base
- Boundary Plans: なし（`close-names` と `cycle-rules` のマージ後なので、`close` と `work` のスキルと collect の中で閉じる）

## Files

```text
.pi/skills/close/scripts/collect.mjs          update
.pi/skills/close/scripts/collect.test.ts      update
.pi/skills/close/references/format.md         update
.pi/skills/close/SKILL.md                     update
.pi/skills/work/SKILL.md                      update
```

## Slices

## 1.`ex-` のプランの名前と事例の前提

ADR 07 の `Adopted` は `NN-<plan id>.md` の例として `06-ex-doc-lists.md` を挙げ、`ex-` に番号を付ける形で書いた。残る 13 件の `Fact` にあるオーナーの指示「`NN-` は数値の順に並び、`ex-` はその後」がこれを上書きする。ADR の記録はそのままにし、スキルとスクリプトをその指示に合わせる。

### Types

```ts
/** 番号を持つプラン */
type Normal = { readonly nn: string; readonly id: string };
/** `NN-` を持たない `ex-` のプラン */
type Ex = { readonly nn: null; readonly id: string };

/** ファイル名からプランの番号と id を求める。`ex-` 以外は `NN-` がなければ投げる（検証はこの関数の中で行う） */
export function planName(file: string): Normal | Ex;

/** 並び順の値。`ex-` は 1、それ以外は 0 */
export function planRank(id: string): number;

/** 残りの 1 件。番号の有無は `Normal` か `Ex` で決まる */
type Leftover = { readonly plan: string; readonly link: string } & (Normal | Ex);

/** `ex-` のプランの `No` を Triage から、通常のプランの `No` を plan md から読む */
export function noOf(planId: string, text: string, closeText: string): string | null;

/** 番号行の下の文脈を `### <NN> <plan id>` と `### <plan id>` の両方の見出しから読む */
export function readContexts(text: string): Map<string, string[]>;

/** 残りをプランごとにまとめて 1 つのテキストにする */
function render(items: readonly Leftover[], contexts: Map<string, string[]>): string;

/** `plan/` にある plan md を集める */
export function collectCycle(planDir: string, closeText?: string): readonly Leftover[];
```

### Steps

1. `.pi/skills/close/scripts/collect.mjs`:
   - update: `planName` の戻り値を `Normal | Ex` にし、`NN-` のない `ex-` の名前は `{ nn: null, id: 名前全体 }` とし、`NN-` のある名前は `{ nn, id }` とし、どちらでもない名前では投げるようにする。JSDoc も直す。`planName` の判定は 1 か所に保ち、`planRank` はその戻り値の `id` だけを見る。
   - update: `Leftover` を `{ plan, link }` と `Normal | Ex` の交差にし、`nn` の有無を型で表す。
   - update: 並び順は `planRank` の順とし、その中では `Normal` は `Number(nn)` の数値の順、`Ex` は `id` の `localeCompare` の順にする。`Number(null)` は使わない。
   - update: `render` の見出しは、`Normal` を `### <NN> <plan id> (ADR <No>)` に、`Ex` を `### <plan id> (ADR <No>)` にする。
   - update: `readContexts` は `### <NN> <plan id> (ADR <No>)` と `### <plan id> (ADR <No>)` の両方を読み、`<plan id>:<line>` の鍵は変えない。移行のためではなく、`ex-` のプランの新しい見出しを `close` の手順 9 の再実行で `## Collected` を作り直すときに読めるようにするためである。
   - update: `planRank`、`render`、`readContexts`、`collectCycle` の JSDoc を、`nn` がない場合にも対応する形に直す。
2. `.pi/skills/close/references/format.md`:
   - update: `## Collected` の見出しの形を、`NN` のあるプランは `### <NN> <plan id> (ADR <プランの No の値>)`、`ex-` のプランは `### <plan id> (ADR <プランの No の値>)` にする。
   - update: 並び順の説明を「`NN` のあるプランは `NN` の数値の順、`ex-` のプランはその後ろに名前の順」にする。
3. `.pi/skills/close/SKILL.md`:
   - update: 第 3 手順の `## Collected` の見出しの文を、`NN` のあるプランは `### <NN> <plan id>`、`ex-` のプランは `### <plan id>` にする。
4. `.pi/skills/work/SKILL.md`:
   - update: 第 3 手順の `plan/<NN>-<plan id>.md` の記述を、`NN` のあるプランは `plan/<NN>-<plan id>.md`、`ex-` のプランは `plan/<plan id>.md` にする。
5. `.pi/skills/close/scripts/collect.test.ts`:
   - update: (happy) テストデータを作る関数で通常のプラン 2 件（`01`、`02`）と `ex-` のプラン 2 件を作って collect する → 見出しは通常の 2 件が `NN` の数値の順に並び、そのあとに `ex-` の 2 件が名前の順に並び、`ex-` の見出しに `NN` がない
   - update: (error) `plan/` に `NN-` も `ex-` もない名前を置いて collect する → `no NN prefix: <ファイル名>` を投げる
   - update: (happy) `ex-` の見出しを持つ close.md で手順 9 を再実行する → 番号行の下の文脈が `ex-` の見出しの下にも残る
   - update: (error) 空の `## Triage` を持つ close.md で `ex-` のプランの `No` を読む → 戻り値は null になる
   - update: (error) 空の `## Triage` を持つ close.md で collect する → `ex-` のプランの見出しが `ADR 未特定` になる
   - update: 題名の「Triage 行がない close.md」を「空の `## Triage` を持つ close.md」に変え、テストの前提と題名を合わせる

### Verify

- Always:
  - `pnpm test:run .pi/skills/close`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - grep ツールで `no NN prefix` を `.pi/skills/close` で検索し、1 件だけあることを確かめる
  - grep ツールで `### <NN> <plan id>` を `.pi/skills/close/SKILL.md` と `.pi/skills/close/references/format.md` で検索し、各 1 件だけあることを確かめる
  - grep ツールで `### <plan id> (ADR <プランの No の値>)` を `.pi/skills/close/references/format.md` で検索し、1 件だけあることを確かめる
  - grep ツールで `Triage 行がない` を `.pi/skills/close/scripts/collect.test.ts` で検索し、0 件であることを確かめる
  - `pnpm test:run .pi/skills/close` で、見出し・並び順・文脈保持・題名の事例が通ることを確かめる
  - 変更した 5 件のファイルを読み、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: base — オーナーが差分を読んで OK する

## 2.`ex-` のプランを通常のプランと同じ扱いに戻す

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/work/SKILL.md`:
   - update: 第 4 手順の `base` の行から「`ex-` の `base` プランはオーナーの OK を待たない」と「`ex-` の `base` プランは例外」の 2 文を消し、「`ex-` でない `base` プラン」という限定も消して、「`base` のプランは、1 スライスごとにオーナーに見せ、OK のあと `base(<plan id>): <subject>` でコミットする」に戻し、第 7 手順はそのままにする。
2. `.pi/skills/close/SKILL.md`:
   - update: 第 5 手順の Triage 行を `- <N>: _ex-plan_ (ADR <NN>, <定義の部分>)` にし、プランの名前はまとめの段落で書く形にし、「`ex-` のプランは、レビュー・修正・コミットを挟む」の段落もまとめの段落のあとに置く形に直す。
   - update: 第 8 手順の前に、1 件ずつチャットで説明して判断を待つステージを置き、説明には何が起きているか、どの段階でなぜそうなったか、いま何に困っているか、どう直すか、直す範囲はどこかを、参照ファイルを読んでいない前提でも分かる形で書く。
   - update: 第 9 手順の前に、確認済みの `ex-` の残りを直すファイルごとにまとめるステージを置き、プラン名・残りの番号・直すファイルの表をチャットで見せ、オーナーが認めてから `## Triage` の行にプラン名を書く形にする。
   - update: 第 9 手順の「write each confirmed `ex-` leftover's plan directly」を、まとめた `ex-` のプランをすべて書いてレビューし、修正してコミットし、そのあと作業を 1 つずつ実行する、に変える。
   - update: 第 9 手順と第 10 手順の「when its `Place` is worktree make a worktree, when `base` run without the owner's OK」を「when its `Place` is worktree make a worktree, and run its work」に変え、`base` の扱いは `work` のスキルの第 4 手順に従う形にする。
   - update: 第 11 手順の「the shape and the rules of the file」を「the shape and the rules of the table」にする。
   - update: `## How not to do this` の「Do not triage with the owner line by line before `close.md` is complete」を「…before every destination is in `## Triage`」に変え、1 件ずつの説明は提案の完成後に行うことを明確にする。
3. `.pi/skills/close/references/format.md`:
   - update: Triage 行の形を `- <N>: _ex-plan_ (ADR <NN>, <定義の部分>)` とし、まとめの段落で `_ex-plan_ <plan id>` になることを書く形にし、`_ex-plan_ <plan id>` を必ず置くという文をまとめの前には名前を書かない形に改める。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - grep ツールで `without the owner's OK` を `.pi/skills` で検索し、0 件であることを確かめる
  - grep ツールで「that is not an `ex-` plan」を `.pi/skills/work/SKILL.md` で検索し、0 件であることを確かめる
  - grep ツールで `the shape and the rules of the table` を `.pi/skills/close/SKILL.md` で検索し、1 件だけあることを確かめる
  - grep ツールで `before every destination is in` を `.pi/skills/close/SKILL.md` で検索し、1 件だけあることを確かめる
  - 変更した 5 件のファイルを読み、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: base — オーナーが差分を読んで OK する

## Notes

### Slice 1: `ex-` のプランの名前と事例の前提

- Findings: なし
- Unplanned: `Leftover` の `plan` が plan id を兼ねているので、`Types` の `{ plan, link } & (Normal | Ex)` の `id` は足さず、`nn` の有無だけを交差で表した。
- Commit: `79172f6`
- Stopped: なし

### Slice 2: `ex-` のプランを通常のプランと同じ扱いに戻す

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
