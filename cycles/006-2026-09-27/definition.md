# ハーネス付きスターター

## What

### Type

プロジェクトと、そのエージェント用ハーネスが一緒に立ち上がるスターター。web 関係のありとあらゆるものを作るための汎用性が高いもの。

Changes: keep

### Who

- owner:clone する人。プロジェクトの持ち主
  - Does: 判断をする（何を作るか、何が要るか、何が要らないか）
  - Needs: エージェントが 1 人で進められること。判断は自分のところに来ること
- agent:同じリポジトリで作業する側
  - Does: プロダクトを作る（サイクルを回す）
  - Needs: 規則、検査、基準、記録が最初から揃っていること

Changes: keep

## What to build

### 1. consult

- Change: update
- Actor: agent
- Does: 子に任せる
- Now:
  - 型の定義（`types.json`）をどう配るかが決まらず、git 管理外なので clone にも子の worktree にも渡らない
  - `consult` の README が、`types.json` を「git 管理外の個人の設定」として説明している
  - 子が残した作業ファイル（`.flat` など）が、成果と一緒に ref のコミットに入る
- Then:
  - 型の定義が、clone した人にも、`HEAD` から作る子の worktree にも、同じものとして渡る（写す手順も、渡す仕掛けも要らない）
  - `consult` の README が、`types.json` はリポジトリに入っているものとして説明している（写し方ではなく、変え方）
  - ref のコミットに入るのが、子の成果だけになる

### 2. secret-guard

- Change: update
- Actor: agent
- Does: 子に読ませない
- Now:
  - guard で `$VAR` が未定義のときの動きが偶然に頼っている
  - guard が読む `read` のキー名が確かめられていない
- Then:
  - guard の判断が、変数が未定義でも、別のキー名で来ても同じ形になる

### 3. ref-cleanup

- Change: update
- Actor: agent
- Does: ref を片付ける
- Now:
  - `ref-cleanup` が `consult` とは別の拡張として `.pi/extensions/` に並んでいる
  - `consult/git-env.ts` が `policy/` `child/` `run/` `tool/` のどれでもない所にある
  - `consult` の README が、1 つの道具と 4 つの層を説明している（統合すると食い違う）
- Then:
  - 拡張は `consult` 1 つで、`consult` と `ref_cleanup` の 2 つの道具が同じ所から出ている
  - `git-env.ts` は決まった層にあり、git を起動する側がどこから読むかが一意
  - `consult` の README が、2 つの道具（`consult` / `ref_cleanup`）と、実装の木（`policy/` `child/` `run/` `tool/`）を説明している

### 4. tickets-skill

- Change: update
- Actor: agent
- Does: チケットを切る
- Now:
  - `Commit: なし` の置き場が `tickets/references/format.md` に無い
- Then:
  - 変更の無い step の閉じ方（`Commit: なし` と理由）が `format.md` にある

### 5. work-skill

- Change: update
- Actor: agent
- Does: step を閉じる
- Now:
  - `read` / `use` の検証で、子をどう起こすかが `work/SKILL.md` に無い
- Then:
  - `work/SKILL.md` step 7 に、`read` / `use` は `consult` の子を 1 体走らせる、と書いてある
  - チケットが名指しした type に文書を `input` で渡し、返ってきたテキストを証拠にする、と書いてある

### 6. readme

- Change: update
- Actor: owner
- Does: `README.md` を開く
- Now:
  - README が `ref-cleanup` を独立した拡張として数えている
  - README が、`consult` の道具に触れていない（拡張の 1 行としてだけ書いている）
  - README が、`types.json` を「例を写して自分のモデルを入れるもの」と書いている
- Then:
  - README の拡張の行が、`consult`（`consult` と `ref_cleanup` の 2 つの道具を持つ）、`quality-gate`、`sound-notify` の 3 つを並べている
  - README の「使い始める」から例を写す手順が消え、`types.json` はリポジトリにあるものとして書いてある

## What to keep

- `check-suite` From: 001
- `commit-gate` From: 001
- `quality-gate` From: 001
- `agent-rules` From: 001
- `sound-notify` From: 001
- `input-guard` From: 003
- `stack-skill` From: 003
- `definition-skill` From: 003
- `plan-skill` From: 003
- `close-skill` From: 004

## Stack

- Runtime: Node / TypeScript
- Deploy: なし
- Added:
  - pnpm
  - lefthook
  - oxlint
  - oxfmt
  - vitest
  - `@earendil-works/pi-coding-agent`
  - typebox

Changes: keep

## Retro

### Good

- チケット 8 枚が全部、名指したコミットで閉じた（`008d43c` / `6238e24` / `435e20f` / `21369e5` / `b27c4bf` と `なし` 2 枚）
- 検証の子が本物の穴を 4 つ見つけ、その場で直した — YAML frontmatter の文書で子が起動しない（`--` を捨て）、`${X:-.env}` と `$'...'` が guard を素通りする、Verify の型（`read`）と子の型（`review`）の衝突、報告をどう子に渡すか
- 穴 3 は穴ではなかった（`review` の子は読むだけ）。穴 8 は owner が落とし、穴 11 は 005 の定義書から 2 行消して直した
- `ref-cleanup` が `consult` に統合された — 拡張は 3 つ、`consult` が 2 つの道具を持ち、`.pi/extensions/ref-cleanup/` は無い（`b27c4bf`）。道具は実演で確かめた
- `types.json` がコミットされ、clone でも子の worktree でも同じものが読める（`435e20f`、実演で確認）
- guard が、解決できない `$` を推測せず止める形になった（`21369e5`）
- 統合の 1 本が単位をまたいで通った — 子が `types.json` を読む、`cat .env` が child-guard に拒まれる、成果が ref で返り `ref_cleanup` で消える。何も残っていない

### Bad

- 穴 11 を最初に「unit の意味が取れない」という理由で落とした — 私の誤読で、owner の決定として書いてしまった
- 定義書を凍結後に書き直した（`f0e7691` → `f965eb7`）— unit 1 の `Now` が原因と症状を別の行にしていて、問題が 2 つに見えていた
- `input` にパスを 2 つ渡して子が 2 体走った（1 パス 1 体の仕様を読み違えた）。同じ 2 枚を 2 体が実装し、片方を落とした
- owner の確認を取らずにレビューの子へ回し、何度も止められた。順序を手順に足した
- 検証が長引いた — チケット 1・2 だけで 6 回走らせ、うち 2 回は偽のチケットを材料にして「書けない」で返った
- 8 を owner が落とした — 気にしなくてよい

### Carry over

1. `.pi/skills/` の 6 スキル: owner の確認と、レビューの子、どちらが先かが決まっていない。owner の指摘を反映したあと owner に見せずにレビューへ回し、owner が何度も止めている。順序を決める From: 006.definition
2. `.pi/skills/*/SKILL.md` の `The review's checklist`: 観点が形（節、欄、型、単位の名前）に寄っていて、owner の指摘への直しが正しいかを見る観点が無い。観点を決め直す From: 006.definition
3. `tickets/references/format.md`: `Commit: なし（理由）` の適用範囲が `.check` の例示だけになっている。一般則にするか例示を増やすかを決める From: 006.01-tickets-skill
4. `consult/child/spec.ts`: `input` に置く文書の先頭が `@` のとき、`--` の後ろでも pi がファイル引数として読む。子の起こし方（argv か stdin か）を決める From: 006.02-work-skill
5. `work/SKILL.md`（step 7）: チケットの `Verify` ブロックの形と `Acceptance` の注記は `tickets/references/format.md` の持ち物だが、実行の段からそこを指していない。参照を足すか、走らせ方に形を含めるかを決める From: 006.02-work-skill
6. `work/SKILL.md`（step 7）: `read` の合否基準（期待値）をチケットに書く欄が無い。置き場を決める From: 006.02-work-skill
7. `consult/README.md`（`## Settings`）: `types.json` の場所が「このファイルの隣」としか書かれていない。パスを書くか、この書き方でよいと決める From: 006.03-consult.policy-source
8. `consult/policy/types.ts`（`loadTypes`）: 読めない理由が権限でも「コミットしてある。復元しろ」と言い切る。原因で分けるか、言い切らない形にする From: 006.03-consult.policy-source
9. `consult/run/run.ts`（`commitWorktree`）: 子の作業ファイルが ref に入る穴（004 の報告）は 2 回の観測で再現しなかった。再現したら名前を記録して、外し方を決める From: 006.04-consult.ref-content
10. `consult/child/guard.ts`: 空白での分割はシェルの単語分割ではない（`cat${IFS}.env` が通る）。分割をシェルに寄せるか、この穴を受けて境界の説明を強めるかを決める From: 006.06-secret-guard
11. `consult/child/guard.ts`: `;` `|` `<` `>` が語に接着した形（`cat .env;ls`、`cat <.env`）は通る。演算子でも切るか、受け入れるかを決める From: 006.06-secret-guard
12. `consult/child/guard.ts`: 非 bash の `path` は展開しないが、pi は `~` を展開する。見方を揃えるかを決める From: 006.06-secret-guard
13. `README.md` / `README.ja.md`: 「the formatter runs first」は実物（`lint:fix` → `format`）と逆。文面を直すか、順序を変えるかを決める From: 006.08-readme
14. `README.md` / `README.ja.md`: 「On every agent turn」は、変えた物が無いターンでは検査が走らないので成立しない。文面を直すか、毎ターン走らせるかを決める From: 006.08-readme
15. `README.md` / `README.ja.md`: `types.json` のパスが無い（7 と同じ穴） From: 006.08-readme
16. `README.md` / `README.ja.md`: `.github/workflows/pullfrog.yml` が「入っているもの」に無い。書くか、書かないと決める From: 006.08-readme
