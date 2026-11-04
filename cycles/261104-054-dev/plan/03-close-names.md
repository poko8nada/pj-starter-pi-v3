# PLAN `close-names`

- No: 04, 07
- Place: worktree
- Boundary Plans: `cycle-rules` (02) は `.pi/skills/close/SKILL.md` と `.pi/skills/work/SKILL.md` を先に書き、このプランはその変更のうえに書く。

## Files

```text
.pi/skills/close/
  SKILL.md                    update
  references/
    format.md                 update
  scripts/
    collect.mjs               update
    collect.test.ts           update
    collect.fixture.ts        update
.pi/skills/plan/
  SKILL.md                    update
  references/
    format.md                 update
    tasks.md                  update
.pi/skills/work/
  SKILL.md                    update
  references/
    tasks.md                  update
```

## Slices

## 1.トリアージの表記

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/close/references/format.md`:
   - update: `ex-plan` の6行（`:18`、`:47`、`:59`、`:60`、`:64`、`:65`）を `_ex-plan_` にし、`proposed` の5行（`:21`、`:22`、`:58`、`:59`、`:61`）を `_proposed_` にし、id を `_ex-plan_` のすぐ後ろに置く文（`:65`）の主語を `_ex-plan_` に直し、`## Triage` と `## Collected` と提案順の説明も `_ex-plan_` と `_proposed_` の語でそろえる。
2. `.pi/skills/close/SKILL.md`:
   - update: `proposed` の2件（`:53`、`:58`）を `_proposed_` にし、集めて提案して閉じる流れの中でも `_proposed_` の語で読めるようにする。
3. `.pi/skills/close/scripts/collect.mjs`:
   - update: `readTriageNos` の正規表現（`:235`）とその上の注釈（`:226`）の `ex-plan` を `_ex-plan_` に合わせ、古い `ex-plan` の形は読まない（互換の分岐を残さない）。
4. `.pi/skills/close/scripts/collect.fixture.ts`:
   - update: Triage 行の区分（`:34`）を `_ex-plan_` にし、検査が `_ex-plan_` の行を組み立てるようにする。
5. `.pi/skills/close/scripts/collect.test.ts`:
   - update: (happy) `_ex-plan_` 行を持つ close.md で `ex-` の plan の `No` を読む → `ADR <NN>` の値になる
   - update: (error) 旧 `ex-plan` 行だけを持つ close.md で `ex-` の plan の見出しを書く → `ADR 未特定` になる（古い形は読まない）
   - update: (error) Triage 行が無い close.md で `ex-` の plan の見出しを書く → `ADR 未特定` になる

### Verify

- Always:
  - `pnpm test:run .pi/skills/close`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - grep ツールで `\bex-plan\b` を `.pi/skills/close` から検索し、0件であることを確かめる
  - grep ツールで `\bproposed\b` を `.pi/skills/close` から検索し、0件であることを確かめる
  - 変更した5ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: `other — node scripts/checks/ja-check.mjs .pi/skills/close/references/format.md .pi/skills/close/SKILL.md` の集計が `error 0`、`warn 0` で終わる

## 2.プランのファイル名の `NN-` の文書

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/SKILL.md`:
   - update: `plan/<plan id>.md` の3件（`:3`、`:12`、`:74`）を `plan/<NN>-<plan id>.md` にし、`NN-` は plan id に含めないと書く。
2. `.pi/skills/plan/references/format.md`:
   - update: ファイルのパスの行（`:3`）を `plan/<NN>-<plan id>.md` にし、`NN-` は plan id に含めないと書く。
3. `.pi/skills/plan/references/tasks.md`:
   - update: レビューの任務文のパス（`:8`）を `plan/<NN>-<plan id>.md` にする。
4. `.pi/skills/work/SKILL.md`:
   - update: 読む plan md のパス（`:16`）を `plan/<NN>-<plan id>.md` にする。
5. `.pi/skills/work/references/tasks.md`:
   - update: 任務文の plan md のパス3件（`:8`、`:35`、`:70`）を `plan/<NN>-<plan id>.md` にする。
6. `.pi/skills/close/SKILL.md`:
   - update: plan md のファイル名から `NN-` を除いたものを plan id とし、`## Collected` の見出しには `NN` を付けると書く一方、Triage 行の plan id は `ex-<what it fixes>` のままで `NN-` を付けないと書く。
7. `.pi/skills/close/references/format.md`:
   - update: 見出しを `### <NN> <plan id> (ADR <プランの No の値>)` にし、並びを `NN` の数値の順（通常のプランが先、`ex-` のプランが後）にし、Triage 行の plan id は `ex-<what it fixes>` のままと書く。

### Verify

- Always:
  - `pnpm test:run .pi/skills/close`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - grep ツールで `plan/<plan id>.md` を `.pi/skills` から検索し、0件であることを確かめる
  - grep ツールで `plan/<NN>-<plan id>.md` を `.pi/skills` から検索し、1件以上であることを確かめる
  - grep ツールで `ex-<what it fixes>` を `.pi/skills/close/references/format.md` から検索し、1件以上であることを確かめる
  - 変更した7ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: `other — node scripts/checks/ja-check.mjs .pi/skills/close/SKILL.md .pi/skills/close/references/format.md` の集計が `error 0`、`warn 0` で終わる

## 3.`NN-` の収集

### Types

```ts
/** ファイル名から plan の番号と id を出す。番号が無ければ投げる（検証はこの関数の中） */
export function planName(file: string): { readonly nn: string; readonly id: string };

/** 残りの1件に plan の番号を足した形 */
type Leftover = {
  readonly plan: string;
  readonly nn: string;
  readonly link: string;
  readonly line: number;
  readonly place: string;
  readonly finding: string;
  readonly handling: string | null;
};
```

### Steps

1. `.pi/skills/close/scripts/collect.mjs`:
   - update: plan id をファイル名から `NN-` と `.md` を除いて作り、`planRank`（`:223`）と `noOf`（`:249`）はその id で判定し、並び（`:363`）を `NN` の数値の順（通常が先、`ex-` が後）にし、`render`（`:284`）の見出しを `### <NN> <plan id>` にし、`readContexts`（`:317`）は見出しから `NN` を除いた plan id を鍵にして、鍵は `<plan id>:<line>` のままにする。
2. `.pi/skills/close/scripts/collect.test.ts`:
   - update: (happy) `01-alpha.md`、`02-ex-fix.md`、`03-ex-missing.md` の一時ツリーで収集する → 見出しが `### 01 alpha (ADR 02)`、`### 02 ex-fix (ADR 02)`、`### 03 ex-missing (ADR 未特定)` になり、`NN` の数値の順に並ぶ
   - update: (happy) 再実行で番号下の文脈を保つ → 鍵が `<plan id>:<line>` のままで文脈が残る

### Verify

- Always:
  - `pnpm test:run .pi/skills/close`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - grep ツールで `01-alpha` を `.pi/skills/close/scripts/collect.test.ts` から検索し、1件以上であることを確かめる
  - 変更した2ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: なし

## Notes

### Slice 1: トリアージの表記

- Findings: なし
- Unplanned: なし
- Commit: 47f6561 consult(close-names): unify triage terms to _ex-plan_ and _proposed_
- Stopped: なし

### Slice 2: プランのファイル名の `NN-` の文書

- Findings: なし
- Unplanned: なし
- Commit: 001e07a consult(close-names): name plans with the NN prefix
- Stopped: なし

### Slice 3: `NN-` の収集

- Findings: なし
- Unplanned: なし
- Commit: afa3821 consult(close-names): collect NN-prefixed plans in order
- Stopped: なし

### Cleanup: collect.test.ts の重複・廃止の点検（落とすものなし）

- Findings: なし
- Unplanned: なし

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
