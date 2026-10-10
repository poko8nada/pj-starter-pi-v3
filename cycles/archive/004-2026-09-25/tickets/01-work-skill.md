# work-skill

Acceptance:

- 子に任せた場合、そのコミットは ref で返る
- 取り込むかを agent が決める
- チケットは `Commit:` のハッシュで閉じる
- `Notes` に `Findings` と `Unplanned` が書かれている
  - その step の中の穴は直す
  - 次の 1 枚が受ける穴は次の 1 枚に渡す
- 実演のあと、リポジトリに残っているのは自分で消せるものだけ
- unit の diff が `review` の子に当たる
- findings が残っている
- 直したか、理由をつけて答えていないかが `Notes` に書かれている
- 3 周で止まる
- 残りは owner に渡る

## Todo

- `.pi/skills/work/SKILL.md`
  - 実装の順を書く
    - 004 の step 1 は最初
    - 以降の step はこの skill に従って実装されるので、最初に直す
      - `plan` の `Depends` は step 8 と 9 しか見ていない
  - unit を閉じる前に diff を `review` の子に当てる段を足す
    - `tickets` の unit レビューと同じ形にする
      - 固定のチェックリスト
      - 3 周で止めて残りは owner に渡す
      - 子を起こせないなら止まる
  - 場所所を決めて書く
    - `Verify` を親のツリーで走らせた後、`Commit:` を書く前
    - `Notes` の「直した / 理由をつけて答えていない」も同じ場所
  - チェックリストを書く
    - 固定
    - unit の diff とチケットを見る
    - `Todo` に無い変更が入っていないか
    - `Then` が diff で覆われているか
    - ドキュメントと diff が食い違っていないか
    - 直すか、理由をつけて答えていない findings が残っていないか
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）
  - この step は skill 本文の修正で、作るものが無い — ケース無し
- 失敗の入力 (error)
  - 実演でレビューが走らない
  - 3 周を超える
  - 子を起こせない
  - `Verify` の観察項目が拾う
  - 期待する値
    - unit の diff がレビューに当たった記録が `Notes` にある
    - 3 周で止まる
    - 子を起こせないなら止まる（レビュー無しで閉じない）

## Verify

- 実演: 子に `tickets` と `work` だけを読ませ、1 枚を閉じさせる
  - unit の diff をレビューに出た記録が `Notes` に残る
  - 3 周で止まる
  - `Notes` に `Findings` と `Unplanned` がある
  - 実演の後に残ったのは自分で消せるものだけ
  - 子のコミットは ref で返り、親が取り込むかを言う
  - チケットの `Commit:` にハッシュが入る
  - レビューの findings に「直した / 理由をつけて答えていない」が書いてある

## Notes

### Findings

- **`review` の子は `bash` を持たない** — `read` / `ls` / `find` / `grep` / `web_search` だけなので `git diff` を子に走らせられない。Step 8 は diff をリポジトリの外に書き出し、`consult` の `input` として渡し、チケットは子が名前で読む（決めた）
- **`types.json` は git 管理外** — 実物はあるが commit されないので、HEAD から作る子の worktree には入らない。子に diff を走らせられない結論は変わらない（次へ回す）
- **レビューの場所** — `Verify`（Step 7）の後・`Commit:`（Step 9）の前。入れるため Step 8 以降を 1 つ繰り下げ、`The failures the text answers` の `Step 9` を `Step 10` に直した。ツリーが変わったラウンドは Step 7 に戻ると本文に足した（決めた）
- **実演はこの step 自身の流れが兼ねる** — 子が `tickets` と `work` を読み、親が diff を `review` の子にかけた（1 周目 1 / 2 周目 2 / 3 周目 0 blocking）。findings の処遇はここに並べた。別の試し用チケットで回さなかったのは、この step 自体が「子 + 親のレビュー + 閉じ」の形だから（決めた）
- **`Then` と `Acceptance`** — 本文のチェックは `Then` を `Acceptance` と言い換える（写しなので同じもの）。`Acceptance`「findings が残っている」は「残っていない」の意で、合意済みなのでチケットは直さずここに書く（決めた）
- **次の 1 枚が受ける穴: README の `work` の要約** — `README.md` と `README.ja.md:48` の `work` の行に `the review` が無い。本文の `description` には入った。step 9 の「各スキルの役割を `description` と突き合わせる」が受ける（次へ回す）

### Unplanned

- **本文の整合で足した行** — frontmatter `description` に `the review`、`**Work ends when the tree holds it.**` に `the diff has been through the review`、`The failures the text answers` にレビュー失敗 2 行（子を起こせない / 3 周で clean にならない）、`How not to do this` に 1 行（未レビューの diff で閉じない / 3 周を超えない）。`AGENTS.md` の「散文とコードが食い違ったら同じターンで直す」に沿う（決めた）
- **レビュー子が見るもの** — `tickets` の unit レビューと同じ形にした。チケットと diff、3 周で止めて残りは owner。`Todo` は「同じ形にする」とだけ言っていた（決めた）
- **`consult/README.md` の Turns** — `review` の Turns が実物（40）と食い違っていたので合わせた。step 1 の成果物ではないので別コミットにした（決めた）

Commit: 7106b2f（子 `709eac0` + レビューで直した分）
