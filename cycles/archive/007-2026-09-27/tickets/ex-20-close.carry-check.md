# close.carry-check

Acceptance:

- `close` が `Carry over` を組むとき、各 `Findings` 行をフォーカスの基準で**見直す**段があり、フォーカス内だった物は写さずに、その step の穴として直す
- `consult/README.md` の「3 つで全部」という断定が `guard.ts` と食い違わなくなる（今サイクルで見つかった実例を閉じる）

## Todo

- `.pi/skills/close/SKILL.md` の step 4 — `Carry over` の組み立てに 1 段足す
  - 今サイクルの `Findings` の各行を、`work` の step 9 のフォーカスの基準に当てはめ直す
  - 当てはまってしまう行（step の `Todo`・`Files`・`Acceptance`・`Then` の中、またはその step の変更が矛盾させる物）は、その step の穴だった物なので写さない。穴は `ex-` チケットとして切って直す
- `.pi/extensions/consult/README.md` の `## Trust` — `guard.ts` が書いている 4 つ目（同じコマンド内の代入は分からない）を足し、「3 つ」の断定をやめる

## Verify

### read

- `review` の子に `.pi/skills/close/SKILL.md` を渡す
  - 報告させる: `Carry over` を組むとき、今サイクルの `Findings` をそのまま載せるのか、何かを見直すのか。見直すなら何を基準にし、当てはまった行はどうなるか
- `review` の子に `.pi/extensions/consult/README.md` を渡す
  - 報告させる: guard が止める範囲と、その外に残る穴はいくつで、何か

## Notes

### Findings

- なし

### Unplanned

- 子供に渡さず親が実装した（理由: 穴が見つかったのがこの会話で、規則の文言はその場で決まる。work の手順 2 の外れとして記録する）
- `consult/README.md` の修正も同じチケットに入れた（きっかけは `close` の新しい見直しの段が拾った物で、同じ穴の裏表なので分けなかった）

Commit: 3e2c7d9（ex-20 の作業コミット。`read` 2 体（`close` の見直しの段 / README の穴 4 つ）通過）
