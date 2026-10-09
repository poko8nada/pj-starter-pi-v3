# DESIGN 014

## `second-opinion-drop`

`second_opinion` を使っているのは `adr` スキルの1か所だけなので、拡張を消す仕事・その1か所を consult の `review` の子に置き換える仕事・README の一覧を直す仕事が同じ入力（ADR 01-1）を読む。1つの worktree でまとめて消す。

- ADR: 01-1
- Where: worktree
- Scope:
  - second-opinion: 拡張 `.pi/extensions/second-opinion/` を消す
  - adr-skill: 手順6を「ADR を `review` の子に渡し、考慮もれ・調査もれ・実験もれを1回受け取り、親がコメントして owner の意見を経てから Highlight に載せる」に書き換える
  - readme: `README.md` / `README.ja.md` の拡張一覧と道具の一覧から `second-opinion` と `/second_opinion` を外す
- Boundary:
  - Plans: なし
  - External: なし

## `test-scaffold-and-product-ready`

テストとスクリプトの足場をプロダクトに渡す仕事と、ハーネスを外す口を作る仕事は、同じ入力（`.pi/` のテストと足場の置き場）を読むので1つの worktree。plan 1 が消す second-opinion の4本のテストと、plan 1 が触るルート README を避けるため、plan 1 を待つ。

- ADR: 02-1, 03-1
- Where: worktree
- Scope:
  - product-ready: ハーネス自身の物（テストとサイクル記録）を外す口と、消える物を先に見られる口（引数なしは表示だけ、`--run` で実行）を足し、テストとスクリプトの足場は `test/` と `lib/git-env.mjs` に残す
  - consult: `gitEnv` を `lib/git-env.mjs` へ出し、`run/` の5ファイル（`run.ts` の定義と、`child.ts` / `worktree.ts` / `git-env.ts` / `worktree.test.ts`）の import 先を変える
  - plan-skill: Verify の `read` の扱い（子が自分で照合し、consult の子が要るチェックは親が走らせ、親は acceptance で念のため読む）を一行足し、doubles の置き場を `test/` に直す
  - close-skill: doubles の置き場を `test/` に直す
  - readme: `product:ready` の使い方を足す
- Boundary:
  - Plans: `second-opinion-drop`（その merge の後に走る。消える4本のテストの import を触らずに済むため）
  - External:
    - `node`: `scripts/product-ready/` の3つの入口と2つの芯、`lib/git-env.mjs` を、素の ESM として走らせる
      - Contract: `.mjs` だけ。型注釈や変換に依存しない（`node scripts/product-ready/index.mjs` が素で動く）
    - `vitest`: 足場を `test/` へ移した後も `setupFiles` が効き、`pnpm test:run` が緑のままであること
      - Contract: テストが0本だと `vitest run` は exit 1 なので、番人 `test/env.test.ts` が1本残る
