# definition-skill

Acceptance:

- 手順の最初の段が、Type / Who の変更の有無を明示的に聞く
- `What to build` の段が、ユニットごとの `Now` / `Then` を owner と詰める 2 段になっている（草稿の確認と、レビュー後の報告・議論）
- `definition/SKILL.md` の `The review's checklist` が 2〜4 個で、渡すファイルが名指しされ、観点に「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っている
- 手順が owner → レビュー → コミット の順
- レビューのあとに、結果の報告と自分の意見を添える段がある
- レビューは 2 回まで

## Todo

- `.pi/skills/definition/SKILL.md`
  - `## Steps` の 1 段目 — Type / Who の変更の有無を明示的に聞く（初回も、変わらないときも）
  - `What to build` の段 — ユニットごとの `Now` / `Then` を owner と詰める段を分ける: ① 草稿を作り owner の確認を取る ② レビューの結果を owner に報告し、自分の意見を添えて議論する
  - レビューの段 — owner → レビュー → コミット の順、2 回まで
  - `## The review's checklist` — 2〜4 個に絞り、渡すファイル（定義書と、前のサイクルの定義書）を名指しし、観点に「owner が見て同意したか」「直しが owner の指摘に答えているか」を入れる

## Verify

### read

- `review` の子に `.pi/skills/definition/SKILL.md` だけを渡す
  - 報告させる: 最初の段（Type / Who の問い）、`Now` / `Then` を詰める段の数と順序、レビューの観点の数と渡すファイル、レビューのあとに何をするか、回数

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
