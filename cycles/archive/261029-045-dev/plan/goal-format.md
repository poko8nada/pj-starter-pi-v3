# PLAN `goal-format`

- No: 02, 05

## Files

```text
.pi/
  skills/
    design/
      SKILL.md                 update
      references/
        format.md              update
        tasks.md               update
    plan/
      SKILL.md                 update
      references/
        format.md              update
        tasks.md               update
    work/
      SKILL.md                 update
      references/
        tasks.md               update
```

## Slices

## 1.design-goal

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/design/SKILL.md:53`:
   - `Goal` を、`Adopted` の行と `Scope.in` の項目ごとに1行の箇条書きにし、各行を検査で合否を判定できる結果にします。
2. `.pi/skills/design/SKILL.md:73`:
   - 視点の「the `Goal` is checkable」を、`Goal` の各行が検査で合否を判定できることにします。
3. `.pi/skills/design/SKILL.md:78-87`:
   - proofread のステップを、`design/<design id>.md` と `design/references/format.md` を名指す一文とパスにします。校正者の役割の方針に従い、名指したファイルだけを編集すると書きます。
4. `.pi/skills/design/references/format.md:32-34`:
   - `### Goal` の雛形を、`Adopted` の行と `Scope.in` の項目ごとに1行の箇条書きにします。
5. `.pi/skills/design/references/format.md:108-111`:
   - `## Goal` を、「with `X`, `Y` is observed」を満たす各行からなる1行以上の箇条書きに書き直し、`Goal` と `Non-goal` の形を揃えます。
6. `.pi/skills/design/references/tasks.md:45`:
   - review の `Goal` の視点を、`Adopted` の行と `Scope.in` の項目ごとに1行を読み、各行が検査で合否を判定できることにします。

### Verify

- Always:
  - 既定の 5 つを行うこと。
- Added:
  - other — `design/SKILL.md:53` と `design/references/format.md:32-34、108-111` の `Goal` が「one sentence」を要求しないこととし、他の節の「one sentence」の要求は変えないこと。
  - other — `design/SKILL.md` の proofread が `design/<design id>.md` と `design/references/format.md` を一文とパスで名指すこと。
  - other — `design` の review で `Goal` の各行を読み、検査で落とせない行を finding にすること。
  - base — オーナーが `design/SKILL.md`、`design/references/format.md`、`design/references/tasks.md`の文面を読み、OK を返すこと。

## 2.plan-goal

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/SKILL.md:55`:
   - 「the `Goal`'s result」を、`Goal` の各行の結果にします。
2. `.pi/skills/plan/SKILL.md:80-88`:
   - review の `Goal` の視点を、各行が `Steps` と `Verify` に載ることにします。
3. `.pi/skills/plan/SKILL.md:90-99`:
   - proofread のステップを、`plan/<plan id>.md` と `plan/references/format.md` を名指す一文とパスにします。校正者の役割の方針に従い、名指したファイルだけを編集すると書きます。
4. `.pi/skills/plan/references/format.md:124、148`:
   - 「the `Goal`'s result」を、`Goal` の各行の結果にします。
5. `.pi/skills/plan/references/format.md:155`:
   - `Added:` に proofread を書く場合、対象のスキルの proofread の一文とパスを使うと書きます。
6. `.pi/skills/plan/references/tasks.md:10`:
   - review の `Goal` の視点の対象を、`design` の `Goal` の各行にします。

### Verify

- Always:
  - 既定の 5 つを行うこと。
- Added:
  - other — `plan/SKILL.md` と `plan/references/format.md` に「the `Goal`'s result」の単数形が残っていないこと。
  - other — `plan/SKILL.md` の proofread が `plan/<plan id>.md` と `plan/references/format.md` を一文とパスで名指すこと。
  - other — `plan` の review で `Goal` の各行を読み、`Steps` と `Verify` に載らない行を finding にすること。
  - other — `plan/references/format.md` の `Added:` の proofread の一文が、`plan/SKILL.md` の一文と同じであること。
  - base — オーナーが `plan/SKILL.md`、`plan/references/format.md`、`plan/references/tasks.md`の文面を読み、OK を返すこと。

## 3.work-cleanup

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/work/references/tasks.md:25`:
   - テストの掃除の「the plan's `## Test cases` would not write」に、「a `Goal` line with no case」を足します。
2. `.pi/skills/work/SKILL.md:52`:
   - テストの掃除の「the tests the plan's `## Test cases` would not write」に、「a `Goal` line with no case」を足します。

### Verify

- Always:
  - このスライスに関係するテスト（`pnpm test:related` が返すものを含む）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、大文字・小文字を区別しない `grep`（`Goal` の行の掃除が `work/SKILL.md:52` と `work/references/tasks.md:25` にあること）。
- Added:
  - other — `work/SKILL.md` と `work/references/tasks.md` の掃除で `Goal` の行を読むこと。
  - base — オーナーが `work/SKILL.md` と `work/references/tasks.md` の掃除の文面を読み、`Goal` の行が入っていることを確かめること。

## Notes

### Slice 1: design-goal

- Findings: なし
- Unplanned: なし
- Commit: d6d672e
- Stopped: なし

### Slice 2: plan-goal

- Findings: なし
- Unplanned: なし
- Commit: 0413fef
- Stopped: なし

### Slice 3: work-cleanup

- Findings: なし
- Unplanned: なし
- Commit: bf8e2c8
- Stopped: なし

## Review

### Round 1

- Stale:
  - なし — 旧文言の残存なし。`.pi/skills/design/SKILL.md:53` の Goal は複数行化済み、`design/references/format.md:32-34,108-111` の one sentence 要求は Goal から除かれ他節 (`.pi/skills/design/SKILL.md:52` の Why、`.pi/skills/design/references/format.md:140` の Writing) のみ残存。`.pi/skills/plan/SKILL.md:55` と `.pi/skills/plan/references/format.md:124,148` に単数形 `Goal's result` なし。旧 proofread 定型なし。`.pi/skills/work/SKILL.md:52` と `.pi/skills/work/references/tasks.md:25` に Goal 行あり。
- Unlisted:
  - なし — `git diff 92e28dd..HEAD --stat` は Files の8件のみ。`git diff 7bd7a01..HEAD` に含まれる3件 (`.pi/skills/adr/scripts/scaffold.mjs`、`.pi/skills/adr/scripts/scaffold.test.ts`、`cycles/261029-045-dev/plan/adr-scaffold.md`) は `git log` の merge `92e28dd` 以前の別プラン (adr-scaffold) のもので本計画の変更ではない。
- Gaps:
  - なし — Slice 1〜3 の Steps は差分どおり実施済み。各 Verify の Added (grep と owner 読会) が対応する行為を直接確認する構成で、自動テストでしか確かめられない行為は本計画にない。
- Unproven:
  - なし — 本計画の8件にテストファイルの変更なし。壊して赤を確認すべき新規テストが存在しない。別プランの `scaffold.test.ts` は本計画の対象外。
- Noise:
  - なし — 本計画で追加したテストなし。magic number / hardcoded string を含むケースなし。
- Doubts:
  - `.pi/skills/close/SKILL.md:64` — `git status` で未コミットの proofread 定型更新あり。Files 外・コミット外のため finding とせず。別途処置 (取込または破棄) が必要。
  - `.pi/skills/plan/SKILL.md:63-64` と `.pi/skills/plan/references/format.md:155-161` — SKILL の Added 要約に proofread の明記なし。SKILL の `or another check` が proofread を含む解釈で矛盾なしと判断し finding とせず。気になるなら close 時に文言統一を検討。
  - `.pi/skills/design/SKILL.md:80` — proofread の対象表記が短形 (`design.md`) で plan/close の長形 (`cycles/...`) と異なる。指示ファイルの特定は可能と判断し finding とせず。

## Acceptance

- Ran: `pnpm test:run`（57ファイル、788テスト）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`。plan の `Verify` の grep（`the Goal's result` の単数形は 0 件、design の `Goal` に「one sentence」なし、4 スキルの proofread の一文）を確認した。オーナーは 3 スライスに OK を返した。
- Findings: なし
- Doubts: なし
