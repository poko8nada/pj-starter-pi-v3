# definition-skill

Acceptance: `cycles/<NNN-DATE>/definition.md` が出て、9 節がある（`Stack` / `Remarks` / `Retro` / `Carry over` は空でよい。`Carry over` が空でよいのは最初の 1 枚だけ）。前のサイクルの `Carry over` の全行が、この 1 枚のどこかに対応している（単位 / `Non-goal` / `Changes` の理由 / 明示的な拒否）。承認までは、`cycles/` 以外に変更が無い。本文が、次のスキルを名指ししない。受けた場所が、その 1 枚から読める（どの `Carry over` の行が、どの unit や `Non-goal` に落ちたか）。どこにも受けない行が残っていない

## Todo

- `.pi/skills/definition/SKILL.md`
  - Step 7（1 枚を書く）に、**会計の節**を足す — 新しい 1 枚が `## Carry over` を持ち、前の `Carry over` の 1 行につき 1 行を書く（`<前の 1 行> → <受けた場所>`）。受けた場所は unit / `Non-goal` / `Changes` の理由 / 明示的な拒否。`Remarks` と同じ形（1 行ずつ）
  - Step 10 の「`Carry over` は次の 1 枚が会計する」を、この節を指すように書き換える（いまは行き先が無い）
  - Step 7 の「8 節」を 9 節に、Step 8 のチェックリスト（the eight sections）も 9 節にする
  - 会計の節が空でよいのは最初の 1 枚だけ（前にサイクルが無い）。2 枚目からは、前の全行が並ぶ
- `.pi/skills/definition/references/format.md`
  - 型に `## Carry over` を足す（`## Remarks` の隣。`<前の 1 行> → <受けた場所>`）と、空でよい条件（最初の 1 枚だけ）を書く
  - 空節の規則（`Retro` / `Stack` / `Remarks` は空でよい）に `Carry over` を足す（条件つき）
- 観点のうち、正常系（happy）→ `Verify` の実演が担う（子が 1 枚書く）
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）→ この step は skill 本文と format の修正で、作るものが無い — ケース無し
- 失敗の入力（会計の行が抜けている / 受けた場所が書かれていない / 8 節のまま / `cycles/` 以外を触る / 次のスキルを名指しする）→ `Verify` の観察項目が拾う。期待する値: 実演で書かれた 1 枚が 9 節で、前の `Carry over` の全行が並び、各行に受けた場所がある / `git status` に 1 枚以外が出ない / 本文に次のスキルがない (error)

## Verify

- 実演: 子に `definition` だけを読ませ、次の 1 枚を書かせる（各行の受けた場所が読める / 9 節が出る / 次のスキルを名指ししていない / 承認までに触ったのは 1 枚だけ — `git status` で見る）+ `format.md` の型に `## Carry over` があり、空節の規則が条件つきで書いてある

## Notes

### Findings

- **owner の指摘（合意時）で 9 節に決まった**（`## Carry over` を足す）。定義の `Then` は 8 節と言っているが、会計の置き場所がいまの 8 節に無いので、`Acceptance` を 9 節に改訂した（理由 = owner の指摘。1 枚の `Remarks` にも記録）。定義の 1 枚は凍結なので、`Then` 自体は触らない

### Unplanned

なし

Commit:
