# readme.tools

Acceptance:

- README が `consult` と `ref_cleanup` の 2 つとして説明し、`consult_resume` が無い、が解ける: `README.md` / `README.ja.md` が 3 つの道具（`consult_new` / `consult_resume` / `consult_refs`）を説明している

Owner: at the end

## Todo

- `README.md`
  - Extensions の行 — 3 つの道具の説明に書き換える: `consult_new`（会話を見せずに子を走らせる）、`consult_resume`（止まった子の場所を一覧し、そこに子を送り込み、要らなくなったら消す）、`consult_refs`（残した ref の一覧と削除）
- `README.ja.md`
  - 同じ行を同じ意味の日本語で書き換える（英語と日本語で食い違わせない）

## Verify

### form

- `git grep` で確かめる（1 行）
  - `git grep -c "consult_new\|consult_resume\|consult_refs" -- README.md README.ja.md` → 両方のファイルで 3 以上（happy）
  - `git grep -n "ref_cleanup" -- README.md README.ja.md` → 0 件（happy）
  - `consult(` や `name: 'consult'` のような道具としての `consult` → 0 件（happy）
- 英語と日本語を突き合わせる
  - 3 つの名前が両方にあり、説明の役割が同じ（happy）

## Notes

### Findings

- 拡張の README の道具表が、登録された道具の数に追随していない: `.pi/extensions/consult/README.md` の「The extension registers two tools.」と 2 行の表がそのままで、`consult_resume` を道具として数えていない（本文には「Resuming a stopped child」の節がある）
  - なぜ外か: このチケットと計画の `Files` は `README.md` / `README.ja.md` だけ。`consult/README.md` は step 7 と step 12 の `Files` で、step 12 の「`consult/README.md` が追随している」はここを指す
  - 観測: `consult/index.ts` の `registerTool` は 3 つ（`consult_new` / `consult_resume` / `consult_refs`）。README の Tools の表は 2 行。`git grep -n "registers two tools" .pi/extensions/consult/README.md` が 1 件
  - この環境の条件: ルートの README は 3 つ、consult の README は 2 つと言う。step 19 の検査は名前（`ref_cleanup`、道具としての `consult`）しか見ないので、この数の食い違いはすり抜ける

### Unplanned

- `README.md` / `README.ja.md` の Extensions: 3 つの道具を親の 1 行の中ではなく、子の箇条書き（`consult_new` / `consult_resume` / `consult_refs`）として並べた
  - なぜ: Todo は「Extensions の行」を書き換えると言うが、Verify の `git grep -c` は一致する「行数」を数える。1 行のままだと 1 にしかならず、`3 以上` を満たせない。1 道具 1 行にして満たした

- （親の取り込みについて）: この子は worktree で自分でコミットしたため、`commitWorktree` から見ると「変えた物が無い」になり、ref が作られなかった（本文は `ref: (the child changed nothing)`）。worktree が消えるとそのコミットは宙に浮く。今回はオブジェクトが残っていたので `git cherry-pick efca3bd` で取り込んだ（`320a2c8`）。**道具側の穴**: 子が自分でコミットしたときに ref を作る道が無い（次のサイクルで見る）
- （子が書いた指摘のうち古い物）: `consult/README.md` の Tools 節が「two tools」という指摘は、step 12 の影響読みで親が直し済み（`f573a1f`）

Commit: 320a2c8（子が worktree で作ったコミット `efca3bd` を親が取り込んだ物）
