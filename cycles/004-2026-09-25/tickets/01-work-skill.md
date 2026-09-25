# work-skill

Acceptance:

- 子に任せた場合、そのコミットは ref で返り、agent が取り込むかを決める
- チケットは `Commit:` のハッシュで閉じる
- `Notes` に `Findings` と `Unplanned` が書かれている
  - その step の中の穴は直す
  - 外の穴は次の 1 枚に渡す
- 実演のあと、リポジトリに残っているのは自分で消せるものだけ
- unit の diff が `review` の子に当たり、findings が残っている
- 直したか、理由をつけて答えていないかが `Notes` に書かれている
- 3 周で止まり、残りは owner に渡る

## Todo

- `.pi/skills/work/SKILL.md`
  - 実装の順を書く — 004 の step 1 は最初
    - 以降の step はこの skill に従って実装されるので、最初に直す
    - `plan` の `Depends` は step 8 と 9 しか見ていない
  - unit を閉じる前に diff を `review` の子に当てる段を足す
    - `tickets` の unit レビューと同じ形にする
      - 固定のチェックリスト
      - 3 周で止めて残りは owner に渡す
      - 子を起こせないなら止まる
  - 置き場所を決めて書く — `Verify` を親のツリーで走らせた後、`Commit:` を書く前
  - `Notes` の「直した、または理由をつけて答えていない」も同じ場所
  - チェックリストを書く
    - 固定
    - unit の diff とチケットを見る
    - `Todo` に無い変更が入っていないか
    - `Then` が diff で覆われているか
    - ドキュメントと diff が食い違っていないか
    - 直すか、理由をつけて答えていない findings が残っていないか
- 観点（null・空・境界・不正・権限・2 回目・並行）→ この step は skill 本文の修正で、作るものが無い — ケース無し
- 失敗の入力 → `Verify` の観察項目が拾う (error)
  - 実演でレビューが走らない
  - 3 周を超える
  - 子を起こせない
  - 期待する値
    - unit の diff がレビューに当たった記録が `Notes` にある
    - 3 周で止まる
    - 子を起こせないなら止まる（レビュー無しで閉じない）

## Verify

- 実演: 子に `tickets` と `work` だけを読ませ、1 枚を閉じさせる
  - unit の diff をレビューに当てた記録が `Notes` に残る
  - 3 周で止まる
  - `Notes` に `Findings` と `Unplanned` がある
  - 実演の後に残ったのは自分で消せるものだけ
  - 子のコミットは ref で返り、親が取り込むかを言う
  - チケットの `Commit:` にハッシュが入る
  - レビューの findings に「直した、または理由をつけて答えていない」が書いてある

## Notes

### Findings

- `review` の子は `bash` を持たない
  - 根拠は `.pi/extensions/consult/README.md` の表と `types.example.json` の tools が `read`・`ls`・`find`・`grep`・`web_search` のみ
  - だから子に `git diff` を走らせて diff を見せることはできない
  - Step 8 は「diff をリポジトリの外に書き出し、`consult` の `input` として渡す。チケットは子が名前で読む」形にした
- 実際の `types.json` はこのリポジトリに無い
  - README いわくアカウント依存で non-commit
  - この判断は README と example の記載にもとづく
- 置き場所は `Verify`（Step 7）の後・`Commit:`（Step 9）の前
  - あいだに入れるため Step 8 以降を 1 つ繰り下げた
  - `The failures the text answers` の `Step 9` を `Step 10` に直した
- 実演（`Verify`）は親の担当
  - この子は子（`consult`）を起こさない
  - よって次の 2 つは、まだ子の側では観察していない
    - unit の diff が `review` に当たった記録が `Notes` にある
    - 3 周で止まる
- 自分で走らせた検査
  - `pnpm exec oxfmt --check .pi/skills/work/SKILL.md` → All matched files use the correct format
  - `pnpm test:run` → 166 passed
  - `pnpm typecheck` → エラーなし
  - `pnpm lint` → エラーなし
- （親が追記）`types.json` は「無い」のではなく **git 管理外**（実物は存在する）
  - 結論（子に `git diff` は走らせられない）は変わらない
- （親が追記）本文のチェックは `Then` を `Acceptance` と言い換えている
  - `Acceptance` は `Then` の写しなので同じものを指す
- （親が追記）このチケットの `Acceptance`「findings が残っている」は「残っていない」の意
  - 合意済みなのでチケットは直さず、ここに書く
- （親が追記）レビューで blocking が出た
  - レビューを `Verify` の後に置いたので、「`Commit:` は `Verify` が判定した内容」と嚙み合わない
  - **ツリーが変わったラウンドは Step 7 に戻る**と本文に足した
- （親が追記）**実演（`Verify`）は、この step 自身の流れが兼ねる**
  - 子が `tickets` と `work` を読んで step を進めた
  - 親が diff を `review` の子にかけた（3 ラウンド）
    - 1 周目 1 blocking
    - 2 周目 2 blocking
    - 3 周目 0
  - findings の処遇をここに並べた
  - 実演を別の探り用チケットで回さなかったのは、この step 自体が「子 + 親のレビュー + 閉じ」の形をしているため
- （親が追記）外の穴: `README.md` と `README.ja.md:48` の `work` の行の要約に `the review` が無い（本文の `description` には入った）
  - step 9 の「各スキルの役割を `description` と突き合わせる」が受ける

### Unplanned

- `Todo` に無かったが本文の整合のために足した
  - frontmatter の `description` に `the review`
  - `**Work ends when the tree holds it.**` の線に `the diff has been through the review`
  - `The failures the text answers` にレビュー失敗 2 行
    - 子を起こせない
    - 3 周で clean にならない
  - `How not to do this` に 1 行（未レビューの diff で閉じない、3 周を超えない）
  - `AGENTS.md` の「散文とコードが食い違ったら同じターンで直す」に沿う
- 「3 周で止め、残りは owner」と、レビュー子が見るもの（チケット + diff）は `tickets` の unit レビューと同じ形にした
  - `Todo` は「同じ形にする」とだけ言っていた
- （親が追記）`consult/README.md` の `review` の Turns が実物（40）と食い違っていたので合わせた
  - step 1 の成果物ではないので、別コミットにした
- この step は skill 本文の修正なので、観点（null・空・境界・不正・権限・2 回目・並行）にケースは無い
  - 失敗の入力は Step 8 の本文と `Verify` の観察項目が持つ
- `Commit:` は空のまま
  - ハッシュは子では作れない（`git commit` は承認が要る）

Commit: 7106b2f（子 `709eac0` + レビューで直した分）
