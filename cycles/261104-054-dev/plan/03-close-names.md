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

- Stale: なし — `\bex-plan\b`・`\bproposed\b` を `.pi/skills/close` に、`plan/<plan id>.md` を `.pi/skills` に検索し0件、`plan/<NN>-<plan id>.md` と `ex-<what it fixes>` が1件以上あることを確かめた。変更した10ファイルの注釈・見出しも新表記と一致している。
- Unlisted: なし — diff の技能ファイル10件は ## Files の10件と一致し、残りは計画 md 自体の ## Notes 追記（作業記録）である。
- Gaps:
  - 通常 plan を先・`ex-` を後にする順序が `NN` の大小と切り分けられていない。`.pi/skills/close/scripts/collect.mjs:376` の整列は rank 優先だが、`.pi/skills/close/scripts/collect.test.ts:64` の happy は `01`（通常）・`02,03`（`ex-`）と rank と数値順が一致する配置だけを確かめるため、rank を外して純粋な `NN` 数値順にしても緑のままである。理由：`05-alpha`（通常）と `02-ex-fix`（`ex-`）のように rank と数値順が逆になる配置の検査がなく、仕様（通常が先）が検査に運動していない。
    - fixed: `01-ex-fix.md` と `02-alpha.md` の配置を足し、通常が先・`ex-` が後になることを断言して閉じた。
- Unproven: なし — 旧形（`_` 無し行）の無視は `noOf`（`.pi/skills/close/scripts/collect.test.ts:52`）と見出し（`:75`）の両方で逆向きに確かめられ（旧正規表現に戻すと赤になる）、`NN` 付き見出し・順序・文脈保持も外すと赤になることを読みで確かめた。
- Noise:
  - 旧形 Triage の組み立てが2か所で文字面を重複し定数を使っていない。`.pi/skills/close/scripts/collect.test.ts:54` と `:77` の `(ADR 02, xxx)`・`ex-fix` は直上の `adrNo`・`exId` と同じ値の文字面であり、`exId` を改名すると当該 plan の行が存在しないという別理由で null／未特定になり、旧形を無視することの検査が空洞化したまま緑になる。理由：`oldKind` の難読化（grep 0件の維持）は必要だが、`ADR ${adrNo}`・`${exId}` の補間は grep に当たらず安全である。
    - fixed: 旧形 Triage の組み立てを `oldTriageBody` にまとめ、`ADR 02` と `ex-fix` の文字面を `${adrNo}`・`${exId}` の補間にして重複を外した。
- Doubts:
  - 旧 `### <plan id>` 見出しの close.md を新 script で再実行すると、`readContexts`（`.pi/skills/close/scripts/collect.mjs:330`）が `### <NN> <plan id>` だけを読むため番号下の文脈が落ちる。理由：計画は移行を扱わず、閉じた cycle の再実行は通常ないため finding にしない。
  - `plan/` に `NN-` 無し `.md` が1件でもあると `collectCycle` 全体が投げる（`.pi/skills/close/scripts/collect.mjs:373`）。理由：`planName` の投げ自体は仕様だが全件失敗への言及は計画になく、実務上 `plan/` には plan md しか置かないため finding にしない。
  - `.pi/skills/close/scripts/collect.test.ts:83` の題は「Triage 行が無い close.md」だが実際は他 plan の行を持つ `closeWithTriage` で当該行の欠落を確かめている。理由：計画の Step と同文であり、空 `## Triage` も同一経路（空 map）を通るため finding にしない。

## Acceptance

- Ran:
- Findings:
- Doubts:
