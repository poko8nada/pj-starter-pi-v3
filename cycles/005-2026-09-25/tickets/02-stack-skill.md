# stack-skill

Acceptance:

- `definition` の新しい形に沿った手順になっている
- `Stack` 節の形は `definition` の `format.md` にある
- 読んだ者がその通りに動ける（何を、どの順で、どこで owner が入るか）
- 手順が 1 行 1 つに割れている
- 規則が軸・判定・例を持っている
- 太字が本当に大事なものだけになっている

## Todo

- `.pi/skills/stack/SKILL.md`
  - 冒頭: 何をするスキルか（承認済みの定義書に `Stack` を書く。毎サイクル必ず通る）
  - `## Steps`: 11 手順。行為だけを 1 行 1 つ
    - 読む: 定義書（`### Type` / `### Who` / unit の `Does` / `## What to keep` / `## Carry over`）
    - 読む: 前のサイクルの `Stack`
    - 読む: リポジトリから、ランタイムと言語（名前だけ）
    - 調べる: `consult` の `research`。今どき何で作るか、何がいくらか
    - 案: 2〜3 のスタックを作る（出すのか、どこへ出すかも含む）
    - owner が選ぶ（ここで止まる）
    - 試す: リポジトリから読めないものだけ。owner の許可を先に取る
    - 書く: `Stack` を埋める
    - レビュー: `review` の子。3 周まで
    - owner に見せる
    - commit
  - `## The fields` の節を足す。欄の規則と軸・判定・例。`Runtime` / `Deploy` / `Added` / マーカー
  - 決定の規則は本文に置く。stack に `format.md` は無いので、define の `format.md` には置かない
  - 消す: `Goal` / `Non-goal` への言及、`Base:` / `Added:` の雛形、失敗の一覧
  - 太字は手順の頭だけにする
- `.pi/skills/definition/references/format.md`
  - `## The shape` の `## Stack` を、`- Runtime:` / `- Deploy:` / `- Added:` / `Changes:` の形にする
  - `## Markers` に `## Stack` のマーカーの値を書く（`add` / `keep` / `update **理由**`）
  - 決定の規則は書かない（stack の本文にある）
- テストファイル: なし（書類の書き換え。`Verify` に `test` は無い）

## Verify

### read

- `review` の子に `.pi/skills/stack/SKILL.md` を渡す（1 つの子に 1 つの入力）
  - 参照先の `.pi/skills/definition/references/format.md` は、子が自分で読む
  - `Acceptance` の 2・5・6 行を 1 行ずつ判定させ、落ちた行と箇所を報告させる

### use

- `review` の子に `.pi/skills/stack/SKILL.md` だけを渡し、手順を歩かせる
  - 題材: `cycles/005-2026-09-25/definition.md`（`## Stack` は空）、前は `cycles/004-2026-09-25/definition.md`
  - 書き込みはさせず、何を、どの順で、どこで owner が入るかを書き出させる
  - 止まった箇所を行番号で報告させ、`Acceptance` の 3・4 行を判定させる

### form

- `awk 'length > 100' .pi/skills/stack/SKILL.md` → 0 行（3 行）
- `grep -n 'Base:\|Added:' .pi/skills/stack/SKILL.md` → 0 行（2 行）
- `grep -o '\*\*' .pi/skills/stack/SKILL.md | wc -l` → 22（手順の頭 11 つ）（1 行）

## Notes

### Findings

- なし

### Unplanned

- `cycles/005-2026-09-25/definition.md` の `## Stack`: 004 の `Base` の 9 つを読み直して書いた
  - `Runtime: Node / TypeScript` / `Deploy: なし` / `Added: ハーネスの部品 7 つ` / `Changes: update` と理由
  - なぜ: 形が `Runtime` / `Deploy` / `Added` に変わったため。004 のままでは読めなかった。step 2 の `Files` に無いファイルだった。owner の指示

Commit:
