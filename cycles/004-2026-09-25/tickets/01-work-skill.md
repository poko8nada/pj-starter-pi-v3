# work-skill

Acceptance: 子に任せた場合、そのコミットは ref で返り、agent が取り込むかを決める。チケットは `Commit:` のハッシュで閉じる。`Notes` に `Findings` と `Unplanned` が書かれている（その step の中の穴は直し、外の穴は次の 1 枚に渡す）。実演のあと、リポジトリに残っているのは自分で消せるものだけ。unit の diff が `review` の子に当たり、findings が残っている。直したか、理由をつけて答えていないかが `Notes` に書かれている。3 周で止まり、残りは owner に渡る

## Todo

- `.pi/skills/work/SKILL.md`
  - 実装の順を書く — 004 の step 1 は最初。以降の step はこの skill に従って実装されるので、最初に直す（`plan` の `Depends` は step 8 と 9 しか見ていない）
  - unit を閉じる前に diff を `review` の子に当てる段を足す — `tickets` の unit レビューと同じ形にする（固定のチェックリスト / 3 周で止めて残りは owner に渡す / 子を起こせないなら止まる）
  - 置き場所を決めて書く — `Verify` を親のツリーで走らせた後、`Commit:` を書く前。`Notes` の「直した / 理由をつけて答えていない」も同じ場所
  - チェックリストを書く（固定。unit の diff とチケットを見る）:
    - `Todo` に無い変更が入っていないか
    - `Then` が diff で覆われているか
    - ドキュメントと diff が食い違っていないか
    - 直すか、理由をつけて答えていない findings が残っていないか
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）→ この step は skill 本文の修正で、作るものが無い — ケース無し
- 失敗の入力（実演でレビューが走らない / 3 周を超える / 子を起こせない）→ `Verify` の観察項目が拾う。期待する値: unit の diff がレビューに当たった記録が `Notes` にある / 3 周で止まる / 子を起こせないなら止まる（レビュー無しで閉じない） (error)

## Verify

- 実演: 子に `tickets` と `work` だけを読ませ、1 枚を閉じさせる（unit の diff をレビューに当てた記録が `Notes` に残る / 3 周で止まる / `Notes` に `Findings` と `Unplanned` がある / 実演の後に残ったのは自分で消せるものだけ / 子のコミットは ref で返り、親が取り込むかを言う / チケットの `Commit:` にハッシュが入る / レビューの findings に「直した / 理由をつけて答えていない」が書いてある）

## Notes

### Findings

なし

### Unplanned

なし

Commit:
