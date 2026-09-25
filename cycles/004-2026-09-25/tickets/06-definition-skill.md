# definition-skill

Acceptance:

- `cycles/<NNN-DATE>/definition.md` が出る
- 9 節がある
  - `Stack` は空でよい
  - `Remarks` は空でよい
  - `Retro` は空でよい
  - `Carry over` は空でよい
    - 空でよいのは最初の 1 枚だけ
- 前のサイクルの `Carry over` の全行が、この 1 枚のどこかに対応している
  - 受けた場所は単位
  - `Non-goal`
  - `Changes` の理由
  - 明示的な拒否
- 承認までは、`cycles/` 以外に変更が無い
- 本文が、次のスキルを名指ししない
- 受けた場所が、その 1 枚から読める
  - どの `Carry over` の行が、どの unit や `Non-goal` に落ちたか
- どこにも受けない行が残っていない

## Todo

- `.pi/skills/definition/SKILL.md`
  - Step 7（1 枚を書く）に、**会計の節**を足す
    - 新しい 1 枚が `## Carry over` を持つ
    - 前の `Carry over` の 1 行につき 1 行を書く（`<前の 1 行> → <受けた場所>`）
    - 受けた場所は unit
    - 受けた場所は `Non-goal`
    - 受けた場所は `Changes` の理由
    - 受けた場所は明示的な拒否
    - `Remarks` と同じ形（1 行ずつ）
  - Step 10 の「`Carry over` は次の 1 枚が会計する」を、この節を指すように書き換える
    - いまは行き先が無い
  - Step 7 の「8 節」を 9 節にする
  - Step 8 のチェックリスト（the eight sections）も 9 節にする
  - 会計の節が空でよいのは最初の 1 枚だけ（前にサイクルが無い）
  - 2 枚目からは、前の全行が並ぶ
- `.pi/skills/definition/references/format.md`
  - 型に `## Carry over` を足す
    - `## Remarks` の隣
    - `<前の 1 行> → <受けた場所>`
  - 型に、空でよい条件（最初の 1 枚だけ）を書く
  - 空節の規則に `Carry over` を足す
    - `Retro` は空でよい
    - `Stack` は空でよい
    - `Remarks` は空でよい
    - `Carry over` は条件つきで空でよい
- 観点のうち、正常系（happy）→ `Verify` の実演が担う
  - 子が 1 枚書く
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）→ この step は skill 本文と format の修正で、作るものが無い
  - ケース無し
- 失敗の入力（会計の行が抜けている / 受けた場所が書かれていない / 8 節のまま / `cycles/` 以外を触る / 次のスキルを名指しする）→ `Verify` の観察項目が拾う
  - 期待する値
    - 実演で書かれた 1 枚が 9 節で、前の `Carry over` の全行が並び、各行に受けた場所がある
    - `git status` に 1 枚以外が出ない
    - 本文に次のスキルがない (error)

## Verify

- 実演: 子に `definition` だけを読ませ、次の 1 枚を書かせる
  - 各行の受けた場所が読める
  - 9 節が出る
  - 次のスキルを名指ししていない
  - 承認までに触ったのは 1 枚だけ（`git status` で見る）
- `format.md` の型に `## Carry over` がある
- `format.md` の空節の規則が条件つきで書いてある

## Notes

### Findings

- **9 節** — owner の指摘（合意時）で `## Carry over` を足し、`Acceptance` を 9 節に改訂した（決めた）
  - 定義の `Then` は 8 節と言っている
  - 会計の置き場所がいまの 8 節に無い
  - 1 枚の `Remarks` にも記録
  - 定義の 1 枚は凍結なので、`Then` 自体は触らない
- **フローの穴: キャンセル** — 子はキャンセルされたのに、`consult` は子の残した編集をコミットして ref `3c63945` を返した（次へ回す）
  - README には「キャンセルすると子は殺され、worktree は消える」と書いてあり、何も返らないはず
  - `work` skill の経路は成功 / 失敗 / タイムアウト / フック拒否の 4 つで、キャンセルが無い
- **実演** — 練習用の題材の前の 1 枚から `trial` の子に次の 1 枚を書かせた（決めた）
  - 前の 1 枚: `/tmp/definition-toy/previous.md`（`## Carry over` 5 行）
  - 書いた先: `/tmp/definition-toy/next.md`
  - 9 節（`Remarks` と `Retro` だけ空）
  - 前の 5 行に対して 5 行で、全部に着地先がある
  - 次のスキルの名前は 0 件
  - リポジトリと練習用の題材は無傷（ハッシュ一致）
- **実演の題材** — 最初は 003 の 1 枚（82 行）で子が出力上限 50,000 に当たって死んだ（out 51,278）（決めた）
  - 練習用の題材の 5 行に変えて通った
  - 実演の題材は小さく（親の題材選びの失敗）

### Unplanned

なし

Commit: 3c63945（子。実演と記録は親）
