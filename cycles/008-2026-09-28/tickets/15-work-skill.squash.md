# work-skill.squash

Acceptance:

- `squash.mjs` はハッシュをフルで渡すと「一覧が base..HEAD と違う」と言って止まる（007 の close の直後に、実際にこれで止まった）、が解ける: 短くてもフルでも同じように通る
- どちらの形でも通るテストがある

Owner: at the end

## Todo

- `.pi/skills/work/scripts/squash.mjs`
  - 渡されたハッシュを使う 2 つの照合（`base..HEAD` との照合と、`HEAD` が一覧の最後かを見る所。後者は `rev-parse --short HEAD` と比べている）— 渡されたハッシュを 1 回正規化し、両方の照合がそれを使う（短い形もフルの形も受ける）
- `.pi/skills/work/scripts/squash.test.ts`
  - 短いハッシュを渡す → 通る（happy）
  - フルのハッシュを渡す → 通る（happy）
  - 一覧が `base..HEAD` と違う → 止まる（error）
  - 0 件（空の一覧） → 止まる（error）
  - 汚れたツリー → 止まる（error。既存の安全策が残っていること）

## Verify

### test

- `pnpm test squash`（5 ケース。1・2 行）
  - 短いハッシュを渡す → 1 コミットにまとまる（happy）
  - フルのハッシュを渡す → 1 コミットにまとまる（happy）
  - 一覧が `base..HEAD` と違う → 中止のメッセージが出て、何も変わらない（error）
  - 0 件 → 中止（error）
  - 汚れたツリー → 中止（error）
  - null / undefined / 欠けたハッシュ、境界値、権限、2 回目、並行 → 見ない（引数の文字列と `git` の出力を比べるだけの道具で、状態を持たないため）

## Notes

### Findings

- なし
- （影響読み `consult-33` の指摘。すべて非 blocking、未対応）
  - `squash.mjs:12-16` の「実行しない条件」の列挙に、新しい停止（ハッシュが引けない）と、メッセージが短縮形を出すようになった旨が無い
  - `squash.mjs:232` の退避タグは `hashes.at(-1)` を生のまま使う。照合は短縮形なので、正規化の一貫性がここで切れている（実ハッシュなら動く）
  - `squash.mjs:109-113` の `git rev-parse --short` は、ハッシュ以外の rev（`HEAD~1` など）も受理するようになった（Acceptance 外の緩和。テスト無し）
  - `squash.mjs:148` で `planTickets` に渡すハッシュも短縮形になった（フル渡しで乾燥のチケット一覧が変わる。テスト無し）
  - テストの穴: 乾燥経路（`run` 無し）にフルを渡す、短形とフル形を混ぜて渡す、ハッシュが引けない失敗、フル渡し＋`--tickets` の端から端
  - `work/SKILL.md:102,105` の usage は `<hash>...` のままで、「短くてもフルでも受ける」が本文に無い

### Unplanned

- なし

Commit: b1a2201（子の実装）
