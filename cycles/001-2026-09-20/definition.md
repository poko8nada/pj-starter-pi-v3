# ハーネス付きスターター

## What

- Type: プロジェクトと、そのエージェント用ハーネスが一緒に立ち上がるスターター
- Who:
  - owner: clone する人。プロジェクトの持ち主。検査とゲートの恩恵を受ける
  - agent: 同じリポジトリで作業する。規則に従う側

## Goal

新しいプロジェクトを始めたときに、検査・commit ゲート・エージェントの規則が最初から揃っていて、
自分で配線しなくてよい。

## Non-goal

- CI に検査を足さない
  - Why: ローカルのフックが担う。自分用のスターターなので
- clone 先の技術選定に関与しない
  - Why: スタックは clone した側が決める
- 使わない設定を消さない
  - Why: 休眠として残す（react / src / app / pages）

## What to build

1. check-suite
   - Change: add
   - Actor: owner
   - Given: clone 直後。依存は未インストール
   - When: `pnpm install` のあと `pnpm test:run` を叩く
   - Then: format / lint / typecheck / test の 4 つが走り、結果が 1 行ずつ出る。全部通れば exit 0
2. commit-gate
   - Change: add
   - Actor: owner
   - Given: 依存インストール済み。作業ツリーに型エラーが 1 つある
   - When: `git commit` する
   - Then: commit は起きない。落ちた検査とファイルが出る
3. quality-gate
   - Change: add
   - Actor: agent
   - Given: pi セッションが動いている。編集した 2 つの `.ts` のうち片方に型エラーがある
   - When: agent がターンを終える
   - Then: 変えた 2 つが検査され、壊した方だけが差し戻される。緑でないまま終えようとすると直しに戻る。3 回で打ち切る
4. agent-rules
   - Change: add
   - Actor: agent
   - Given: clone 直後。何も説明されていない
   - When: owner が「テストが落ちてるので直して」と頼む
   - Then: `AGENTS.md` の規則に従う。コードに触る前に 1 枚を書き、承認を待つ。検査を弱めない

## Stack

- Runtime: Node 24 / TypeScript 6
- Package manager: pnpm 12
- Checks: oxlint / oxfmt / tsc / vitest
- Hooks: lefthook（pre-commit / pre-push）
- Agent: pi 拡張（quality-gate / consult）

## Retro

- Good:
  - 型（定義 → プラン → チケット）が実際に回った。プランを書く段で定義の穴が見え、チケットを書く段で実装の粒度が決まった
  - 実演を回したので、規則が守られないことが分かった。チェックボックスなら「書いた」で終わっていた
  - `Verify` を動かせない規則が、失敗を失敗のまま残した
  - 自分で違反（`Todo` / `Verify` の書き換え）をやって、その場で規則にできた
- Bad:
  - 機構がスキルとして存在しないので、`agent-rules` の `Acceptance` は達成できない。ハーネスが揃う前に回した
  - `Verify` が実行可能かを確かめずに書いた。`Verify` は後から直せないので、ここが緩いとチケット全体が無意味になる
  - 分量の要求が後から出た。先に出ていれば、`Todo` を書き換える違反は起きなかった
  - 定義・プラン・チケットを同時に初めて回したので、問題の層（どの紙の責任か）を毎回切り分ける必要があった
