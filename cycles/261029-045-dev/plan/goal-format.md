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

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: plan-goal

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 3: work-cleanup

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

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
