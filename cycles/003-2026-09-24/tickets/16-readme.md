# readme

Acceptance: 何が入っているか分かる。最初に何をすればいいか分かる。書いてあることと実物が食い違わない（節の数 / 各スキルの役割 / 検査の数）

（オーナーの指摘で 2 つ広い: 節は 8 つになる（`Remarks` が増える）/ 1 枚に何が書けるかを書く。003 の `Remarks` はまだ無いので、理由はこの ticket の `Notes` と `Retro` に落とす）

## Todo

- `README.md` / `README.ja.md`（ルート。`.pi/extensions/consult/README.md` とは別のファイル）
  - definition の節の数を直す — いま 6 と書いてある。実物は 8 つ（`What` / `Goal` / `Non-goal` / `What to build` / `What to keep` / `Stack` / `Remarks` / `Retro`）。`What to keep` と `Remarks` が抜けている
  - サイクルの表を直す — `work` の行を足し、tickets の行から「実装し、閉じる」を外す（`tickets` は合意で終わる。実装は `work`）
  - 各スキルの役割を実物に合わせる — 表の各行の説明を、`.pi/skills/*/SKILL.md` の `description` と突き合わせる（`definition` / `stack` / `plan` / `tickets` / `work` の 5 つ）
  - 名指しの規則を実物に合わせる — 「次の段を名指ししない」と書きながら、スキル側が名指ししていた。今回それを消したので、規則どおりになる。README の文はそのまま残す（消すのではなく、実物が規則に追いつく）
  - 検査の数を直す — 「同じ 4 つ」と書いてあるが、agent のターンで verify に載るのは `lint` と `typecheck` の 2 つ（実物は `.pi/extensions/quality-gate/checks.ts` の `CHECK_SPECS`）
  - 1 枚に何が書けるかを足す — `Stack` / `Remarks` / `Retro` はコミット後も書ける（凍結されるのは枠と単位）。`Remarks` にはオーナーの指摘と着地先を 1 行ずつ書く
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）→ 文書の修正なので当たらない — ケース無し
- 失敗の入力（数字を間違える / 行が欠ける）→ 下の `Verify` の読み合わせが拾う。期待する値: 節は 8 / tickets の行に「実装」が無い / verify の検査は 2 つ / スキルは 5 つ (error)

## Verify

- 実演: ① `pnpm install` / `pnpm test:run` / `pnpm lint` / `pnpm typecheck` / `pnpm format:check` を走らせる ② `grep -n '^## ' .pi/skills/definition/references/format.md` で節を数え（8）、README に書いた節の名前と一致するか（003 の 1 枚は 7 節のまま。8 節は step 12 が作る形） ③ `sed -n '/^## The cycle/,$p' README.md` を読み、tickets の行に「実装」が無く `work` の行があるか ④ `grep -h '^description:' .pi/skills/*/SKILL.md` と README の表を突き合わせ、5 つの役割が一致するか ⑤ `.pi/extensions/quality-gate/checks.ts` の `CHECK_SPECS` を読み、verify に載る検査の数（2）と README の文が一致するか ⑥ clone 直後のつもりで README だけを読み、何が入っているかと最初の手順が言えるか。結果を `Notes` に書く

## Notes

### Findings

- 実演の結果（`Verify`）: ① 5 つのコマンドが総て緑（`pnpm install` / 166 件 green / lint / typecheck / format）② シートの節は **8**（What / Goal / Non-goal / What to build / What to keep / Stack / Remarks / Retro）で、README の名前列と一致 ③ `tickets` の行から「実装」が消え、`work` の行がある ④ 5 つの skill の `description` と表の役割が一致 ⑤ verify に載る検査は **2**（`lint` / `typecheck`。fix 側は `lint:fix` / `format`）⑥ clone 直後のつもりで読んで、入っているもの（検査 / ゲート / 規則 / 5 skill / consult / 記録）と最初の手順（`pnpm install` → `cycles/` を消す → `types.example.json` をコピー → `pi` 起動）が言えた
- **チケットの `Verify` のコマンドが誤っていた**: `grep -n '^## ' .pi/skills/definition/references/format.md` は **14** を返す（format.md 自身の節が混ざる）。8 を数えるにはコードブロックの中を見る必要がある（`sed -n '/^```markdown/,/^```$/p' … | grep -c '^## '` = 8）。チケットは凍結されているので直さず、正しいコマンドで確かめた
- README の文（「次の段を名指ししない」）はそのまま残した — 実物（skill 側）が規則に追いついたので、消さずに済んだ

### Unplanned

- なし

Commit: 73d7e1d
