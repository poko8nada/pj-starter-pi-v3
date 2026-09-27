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
  - 型の定義（`types.json`）が git 管理外で、clone した人には何も渡らない
  - 子の worktree に `types.json` が無く、実演の「子が起動して返る」が落ちる
  - 子が残した作業ファイル（`.flat` など）が、成果と一緒に ref のコミットに入る
- Then:
  - 型の定義がどう届くかが決まり、`types.json` の無い clone でも子が走る
  - 子の worktree でも同じ定義が読める
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
- Then:
  - 拡張は `consult` 1 つで、`consult` と `ref_cleanup` の 2 つの道具が同じ所から出ている
  - `git-env.ts` は決まった層にあり、git を起動する側がどこから読むかが一意
  - `consult` の README が、2 つの道具と実物の木を説明している

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
  - README が `ref-cleanup` を独立した拡張として数えている（統合すると食い違う）
  - README が、`consult` の道具を 1 つとして書いている
- Then:
  - README が、拡張 1 つと道具 2 つを実物どおりに書いている

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

- 穴 3 は穴ではなかった — レビューの子（`consult` の `review`）は読みだけのツールしか持たないので、ファイルを触れない
- 穴 11 を直した — 005 の定義書で、同じことを 2 回言っていた `Now` の行を、unit 1 と unit 4 から 1 行ずつ消した

### Bad

- 8 を owner が落とした — 気にしなくてよい

### Carry over
