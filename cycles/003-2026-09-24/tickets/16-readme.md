# readme

Acceptance:

- 何が入っているか分かる
- 最初に何をすればいいか分かる
- 書いてあることと実物が食い違わない
  - 節の数は 8
  - 各スキルの役割は `description` と一致
  - 検査の数は 2

オーナーの指摘で 2 つ広い。

- 節は 8 つになる
  - `Remarks` が増える
- 1 枚に何が書けるかを書く

003 の `Remarks` はまだ無いので、理由はこの ticket の `Notes` と `Retro` に落とす。

## Todo

- `README.md` / `README.ja.md`（ルート）
  - `.pi/extensions/consult/README.md` とは別のファイル
  - definition の節の数を直す
    - いま 6 と書いてある
    - 実物は 8 つ（`What` / `Goal` / `Non-goal` / `What to build` / `What to keep` / `Stack` / `Remarks` / `Retro`）
    - `What to keep` と `Remarks` が抜けている
  - サイクルの表を直す
    - `work` の行を足す
    - tickets の行から「実装し、閉じる」を外す
      - `tickets` は合意で終わる
      - 実装は `work`
  - 各スキルの役割を実物に合わせる
    - 表の各行の説明を、`.pi/skills/*/SKILL.md` の `description` と突き合わせる
    - 対象は 5 つ（`definition` / `stack` / `plan` / `tickets` / `work`）
  - 名指しの規則を実物に合わせる
    - 「次の段を名指ししない」と書きながら、スキル側が名指ししていた
    - 今回それを消したので、規則どおりになる
    - README の文はそのまま残す
      - 消すのではなく、実物が規則に追いつく
  - 検査の数を直す
    - 「同じ 4 つ」と書いてある
    - agent のターンで verify に載るのは `lint` と `typecheck` の 2 つ
    - 実物は `.pi/extensions/quality-gate/checks.ts` の `CHECK_SPECS`
  - 1 枚に何が書けるかを足す
    - `Stack` / `Remarks` / `Retro` はコミット後も書ける
      - 凍結されるのは枠と単位
    - `Remarks` にはオーナーの指摘と着地先を 1 行ずつ書く
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）→ 文書の修正なので当たらない — ケース無し
- 失敗の入力 → 下の `Verify` の読み合わせが拾う (error)
  - 数字を間違える
  - 行が欠ける
  - 期待する値
    - 節は 8
    - tickets の行に「実装」が無い
    - verify の検査は 2 つ
    - スキルは 5 つ

## Verify

- 実演: clone 直後のつもりで README だけを読み、次に動けると言える
  - 節を数えると 8 で、名前が `format.md` と一致する
    - 003 の 1 枚は 7 節のまま
    - 8 節は step 12 が作る形
  - tickets の行に「実装」が無く、`work` の行がある
  - スキル 5 つの役割が `description` と一致する
  - verify に載る検査が 2 つと一致する
  - 何が入っているか言える
  - 最初に何をすればいいか言える

## Notes

### Findings

- 実演（`Verify`）: 緑
- **チケットの `Verify` のコマンドが誤っていた**
  - 節を数えるコマンドは 14 を返す
    - `format.md` 自身の節が混ざる
  - 8 を数えるにはコードブロックの中を見る
  - チケットは凍結なので直さず、正しい形で確かめた
- README の文（「次の段を名指ししない」）はそのまま残した
  - 実物（skill 側）が規則に追いついたので、消さずに済んだ

### Unplanned

- なし

Commit: 73d7e1d
