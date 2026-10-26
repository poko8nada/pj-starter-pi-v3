# PLAN `design-goal`

- No: 01

## Files

```text
.pi/
  skills/
    design/
      SKILL.md                update
      references/
        format.md             update
        tasks.md              update
    plan/
      SKILL.md
lefthook.yaml
.oxfmtrc.json
package.json
```

## Slices

## 1.goal-nongoal

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/design/references/format.md`:
   - プランのセクションに `### Goal` と `### Non-goal` を足し、`Goal` を、`Adopted` を内容、`Scope` の `in` を範囲、`Research & Trial` を観測方法とする一文にし、その一文は検査を落とせるものとし、`Non-goal` は関連する `Scope` の `out` と作業者が誤って選びそうな `Options` を理由付きで書くと定めます。
2. `.pi/skills/design/SKILL.md`:
   - 手順 5 に、entry の項目（`Adopted`、`Scope` の `in`、`Research & Trial`、`Scope` の `out`、`Options`、`Definition`、`Context`）から `Goal` と `Non-goal` を合成する手順を足し、手順 7 のレビューに、`Adopted` の各行が `Goal` を満たすこと、`out` が `Non-goal` に含まれること、`Goal` が `Non-goal` に踏み込まないこと、`Goal` を検査できることを足します。
3. `.pi/skills/design/references/tasks.md`:
   - レビューのタスクの 1 点目に、`Adopted` の各行が `Goal` を満たすこと、`out` が `Non-goal` に含まれること、`Goal` が `Non-goal` に踏み込まないこと、`Goal` を検査できることを足します。

### Verify

- Always:
  - `pnpm test:related <changed files>`（関連が無ければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた名前と説明の `grep`（古い文言が無いこと）
- Added: base — オーナーが、`Goal` の一文、`Non-goal` の理由、`Adopted` の各行の `Goal` の充足、`out` の `Non-goal` の包含、`Goal` の `Non-goal` への不踏み込み、`Goal` の検査可能性を読みます。

## Notes

### Slice 1: goal-nongoal

- Findings: なし
- Unplanned: 古い一覧のままでは `Goal` と `Non-goal` の欄が読まれないので、計画の `Steps` に無かった `design/SKILL.md:16` の一覧を、ここで直しました。
- Commit: a573b0e
- Stopped: なし

### Cleanup: なし

- Findings: なし
- Unplanned: なし

## Review

### Round 1

- Stale: なし — `.pi/skills/plan/SKILL.md:20` が旧一覧のままなのは `cycles/261026-041-dev/design.md:83,93` で次プランの仕事と順序が決まっており、他の旧文言は `.pi` の `grep` で見つからなかった。
- Unlisted: なし — 差分の 3 件は `Files` の `update` と一致し、`design/SKILL.md:16` の一覧修正は同ファイル内の開示済み `Unplanned` である。
- Gaps: なし — `Steps` の 3 点は差分にそろい、`Verify` の `Added` の所有者の読みが材料の対応と 4 点の確認を覆う。
- Unproven: なし — テストの `Steps` が無く差分もテストを触らないため、振る舞いを名指すテストが存在しない。
- Noise: なし — 読むべきテストケースが無く、文書の文章は型や制約が断定する内容でも魔数や固定文字列の表明でもない。
- Doubts:
  - `.pi/skills/design/SKILL.md:73` の要約は不踏み込みを明示せず正文は `references/tasks.md:45` が持つため、手順書だけを読む作業者の読み落としの余地が残る。
  - `.pi/skills/design/SKILL.md:80` の所有者への提示物は従来の 3 点のままで、`Goal` を見せるかは計画もデザインも決めていない。

## Acceptance

- Ran: `pnpm test:related`（関連なし）、`pnpm test:run`（718）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、古い文言の `grep` 2 つ（0 件）。オーナーが `Goal` の一文、`Non-goal` の理由、`Adopted` の各行の `Goal` の充足、`out` の `Non-goal` の包含、`Goal` の `Non-goal` への不踏み込み、`Goal` の検査可能性を読みました。
- Findings: なし
- Doubts:
  - `.pi/skills/design/SKILL.md:73` の要約は不踏み込みを明示せず、正文は `references/tasks.md:45` が持つため、手順書だけを読む作業者の読み落としの余地が残ります。
  - `.pi/skills/design/SKILL.md:80` の所有者への提示物は従来の 3 点のままで、`Goal` を見せるかは計画もデザインも決めていません。
