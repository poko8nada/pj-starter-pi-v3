# work.ex-commits

Acceptance:

- `close` が切った `ex-` チケットのコミットのまとめ方が `work/SKILL.md` に書かれていて、一意に決まる（作業コミットは 1 本に潰し、記録は別、`Commit:` は潰した方を指す）

## Todo

- `.pi/skills/work/SKILL.md` の step 11（ユニットの終わり）— `ex-` チケットは 1 つの単位として扱うことを足す
  - 同じ形を通す（ユニットのレビュー、squash、記録コミット）
  - `<base>` はそのチケットの作業を始めた所、`--tickets` はそのチケットを名指す
  - 記録は別コミットで、`Commit:` は潰した作業コミットを指す

## Verify

### read

- `review` の子に `.pi/skills/work/SKILL.md` だけを渡す
  - 報告させる: `close` が切った `ex-` チケットの作業をしたとき、コミットは何本になり、`Commit:` はどれを指すか

## Notes

### Findings

- なし

### Unplanned

- 子供に渡さず親が実装した（理由: 穴が見つかったのがこの会話で、規則の文言はその場で決まる。work の手順 2 の外れとして記録する）

Commit: 9fdb0f7（ex-19 の作業コミット。`read` 通過）
