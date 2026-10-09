# ADR 014

## 01: second-opinion

### 01-1: second-opinion

1. Agenda:
   - Title: `second-opinion` を落とし、ADR の穴探しを consult の子に置き換えられるか
   - Proposal: 拡張 `second-opinion` を落とす。`adr` スキルの穴探しは、ADR を `review` の子に渡して1回見てもらう形に変える
2. Highlight:
   - `second_opinion` を使っているのは `.pi/skills/adr/SKILL.md:53` の1か所だけ。他は拡張本体（実装10＋テスト10）と README 2枚、013 の定義の1行
   - `second_opinion` は直近の会話を自分で読み、同じターンで返す。consult の子はタスク文で材料を受け取り、別プロセスで走って報告を返す。**材料の渡し方が違う**
   - owner の指示: ADR にほしいのは「考慮もれ・調査もれ・実験もれ」の3観点。レビュワーに ADR を渡して、その観点で1回見てもらう
   - owner の指示: 他のレビューと違い、ADR はレビュワーの結果に親がコメントし、owner に見せて意見をもらってから反映する。**実験もれが勝手に `trial` を走らせることと、owner の意図からそれたレビューがそのまま入ることを避けるため**
   - 落とす物: owner 用の `/second_opinion` コマンド（consult に相当する口は無い）
   - 残る物: `consult` の `.run` / `.roles` / `.report`。提案文をタスクに書いて `review` の子を走らせれば、同じ「別の目」は得られる。owner も、エージェントに頼めば同じ物を受け取れる
   - owner の判断: 到着が後続メッセージになるのは機能上の問題ではない（待つだけ）。`adr` スキルの手順6の文面だけをその形に合わせる
   - 指摘への答え（ADR レビュー）: 削除・更新の対象は `.pi/skills/adr/SKILL.md:53`、ルート `README.md` / `README.ja.md` の機能一覧、`.pi/extensions/second-opinion/**`、定義の unit 1行＋feature 1行。`review` ロールは plan 照合用（40ターン / 60000、`cycles/*/plan/*.md` に書ける）だが、専用ロールは新設せずこれを使う
3. Research: なし
4. Trial: `review` の子に ADR を渡し、考慮もれ・調査もれ・実験もれの3観点で1回見てもらう形を走らせた
   - 12件（考慮もれ7・調査もれ3・実験もれ2）が狙いの形で返り、私の誤り2件（対象の数え方、plan スキルの引用）も見つかった。手順6はこの形で成立する
5. Decision: **accepted**

## 02: product-ready

### 02-1: product-ready

1. Agenda:
   - Title: ハーネス自身の物（テストとサイクル記録）を外してプロダクト開発を始める口を、どう作るか
   - Proposal: `scripts/product-ready/` に1つの道具をまとめて足す（`index.mjs` が package の入口、`prune-tests.mjs` / `prune-cycles.mjs` が個別、`targets.mjs` / `cli.mjs` が芯）。package.json に登録するのは `product:ready` だけ（`node scripts/product-ready/index.mjs`）。テストとスクリプトの足場は `test/` と `lib/git-env.mjs` に残す
2. Highlight:
   - owner の指示: ハーネスは完成品として使う。フォーク／ローカルコピーの後に、ハーネス関係のテストを全部外し、サイクルのフォルダを消して、プロダクト向けに整理する
   - owner の指示: 2つは別々のスクリプトにして個別に回せるようにする。登録は `product:ready` だけ、個別は `node scripts/product-ready/prune-tests.mjs` などの直呼び
   - owner の指示: 引数なしは `console.log` で消える物をざっと出し、`--run` で初めて実行する
   - owner の判断: 名前は `product-ready`。`init` は何を対象にするか見えず、`harness-prune` はハーネスごと消えるように読める。**消えるのはハーネス自身の物（テストとサイクル記録）だけで、機能（拡張・スキル・ゲート・規則）は残る**。対象は説明文と README が引き受ける
   - owner の判断: 道具は1ディレクトリにまとめる（`scripts/product-ready/`）。`index.mjs` が package の入口、個別は `prune-tests.mjs` / `prune-cycles.mjs`（`tests.mjs` / `cycles.mjs` では何をするか読めない）。テストはコードの隣に置く（`scripts/product-ready/*.test.ts`）ので、`test/` は足場だけになる
   - owner の判断（プロダクト視点）: 足場は残す。`tmp.ts` は「repo に書かない・後始末する」を全テストに与える物で、plan / close スキルの規約の土台。`setup.ts` は保険で、罠（フック経由のテストが本体 repo を汚す）への入口は `lefthook.yaml` の pre-commit / pre-push としてプロダクトにも渡る。副作用（`HOME` の隔離で git の identity が無い）はあるので、理由を読める形で置く
   - owner の判断: 残す物の番人（`env.test.ts`）も残す。だから削除ルールは「`*.test.ts` を全部」ではなく「`.pi/` の下＝ハーネスのテスト」
   - owner の判断: 置き場はルートの `test/`。`.pi/` はハーネスの領域で、プロダクトの足場が住み続けるのは筋が悪い。スキルの「doubles はここ」も、スターターとプロダクトの両方で正しくなる
   - owner の判断: `test/README.md` は「プロダクト／ハーネス」の区別ではなく、`test/` のファイル群が何のためにあるかで書き直す
   - 実数: `*.test.ts` は37本。`.pi/extensions/**` の36本が消す対象、`.pi/test/env.test.ts` の1本は `test/` へ移して残す。`tmp.ts` の importer は18本で、すべて消す側のハーネステスト。`cycles/` は 001〜013 の13フォルダ
   - 触らない物: `vitest` と `lefthook`、`package.json` の test 系スクリプト（プロダクト自身のテストが使う）。`vitest.config.ts` は参照先を `./test/setup.ts` に移すだけで、`product-ready` は削除も書き換えもしない
   - owner の判断: `gitEnv`（GIT_* を落とす10行）は consult の中に置いたままにせず、`lib/git-env.mjs` に出してプロダクトにも渡す。別の repo で git を打つコードだけが要る helper（いまの repo を触るスクリプトはフックの `GIT_INDEX_FILE` を使うのが正しい）。consult の4ファイルが import 先を変え、**番人は `test/env.test.ts` のまま3件で残せる**（分けなくてよい）
   - owner の判断: テスト0本で `vitest run` が赤くなる件は、番人が残ることで避ける。`passWithNoTests` は入れない
   - 落とした案: `--dry-run` を既定にする（引数なし＝表示、`--run`＝実行に）／`setup.ts` を消す（プロダクトの保険を失う）／`.pi/test/` に置いたまま（スキルの文面とプロダクトの所有が食い違う）／`gitEnv` を consult に残して番人を分ける
   - 危険: この repo 自身で走らせると本物のテストとサイクルが消える。対象ディレクトリを引数で受け、試しは一時ディレクトリで行う
3. Research: なし
4. Trial: worktree `014-init-trial` で、意図した終状態（`test/` への移動＋`.pi/` のテストと `cycles/` の削除＋スキル3行）を1回試した（子1体、worktree ごと破棄）
   - 移動そのものは通る。18本の import は深さが1つ増える（6本が `../../test/tmp.ts` → `../../../test/tmp.ts`、12本が `../../../` → `../../../../`）
   - **`test/env.test.ts` は自分の足で立てない。** 隔離の効果を見る2件は自前だが、`gitEnv` の1件が `.pi/extensions/consult/run/run.ts` を読んでおり、prune の後は行き先が無い
   - **テストが0本だと `vitest run` は exit 1**（"No test files found"）。`vitest related` は0本でも exit 0 なので pre-commit は緑のまま
   - ルート `tsconfig.json` は `.pi` を除外しているので、`test/` へ移ったファイルは `pnpm typecheck` の視野に入る（今まで見えていなかった `env.test.ts` の壊れが表に出た）
   - lefthook はハーネスのテストが無くても正常に走る（`typecheck-staged` も含めて設定変更は不要）。`vitest.config.ts:7` のコメントと、空になる `.pi/test/` の手当てが要る
   - `lib/git-env.mjs` へ移せば、番人の `gitEnv` の1件はそのまま生き、分ける必要は無い（移す先が prune の後も残る場所になるため）
5. Decision: **accepted**

### 02-2: product-ready

1. Agenda:
   - Title: `product-ready` は、どのテストまで外すのか
   - Proposal: 対象を root の walk と除外ではなく、**名指しの一覧**に変える（`TEST_TARGETS = ['.pi', 'scripts/product-ready', 'test/env.test.ts']`。ディレクトリかテストのファイル）。パターンは vitest の既定 include に合わせる。`vitest.config.ts` に `passWithNoTests: true` を足す。`test/README.md` の番人の行、`index.test.ts` と `targets.test.ts` の古い意図、README 2枚の Getting started を直す
2. Highlight:
   - owner の判断: 正しい意図は「**プロダクトとしてスタートした時点でテストがゼロ**」。道具自身のテスト（`scripts/product-ready/*.test.ts`）も番人（`test/env.test.ts`）もハーネスの物なので、一緒に外す
   - owner の判断の理由（02-1 の親の推しを覆した所）: 番人は「足場（`setup.ts` / `tmp.ts`）が今のままであること」を前提にする。プロダクトが足場を作り変えるのは正当な選択で、その時に番人が赤くなる。ハーネスの形を押し付けるテストはプロダクトの物ではない
   - 代償: テストが0本だと `vitest run` は exit 1（014 のトライアルで実測）。`passWithNoTests: true`（vitest 4 の設定、`test` の root オプション）を入れないと、プロダクト開始直後の `pnpm test:run` と pre-push（typecheck + test）が赤くなる。**02-1 の「`passWithNoTests` は入れない」を、このエントリが上書きする**
   - 残る物: 足場（`test/setup.ts` / `test/tmp.ts` / `test/README.md`）と `lib/git-env.mjs`。`test/README.md` は番人の行を落とし、テストはプロダクトがゼロから書くことを書く
   - 実数: いまの `*.test.ts` は30本（`.pi/` 26・`scripts/product-ready/` 3・`test/` 1）。`product-ready --run` の後は0本
   - 触らない物: `lefthook.yaml`（pre-commit の `test:related` は0本でも exit 0、pre-push は `passWithNoTests` で緑）と `package.json` の test 系
   - 落とした案: 番人だけ残す（02-1 の判断。上の理由で覆した）／`passWithNoTests` を入れずに赤を受け入れる（プロダクトの最初の push が通らない）
   - 指摘への答え（ADR レビュー19件。ほぼ全部採る）:
     - owner の判断（形）: 対象は root を歩いて除外するのではなく、**名指し**する。`test/` はディレクトリではなく `test/env.test.ts` という**ファイル**で名指しする（`test/` はプロダクトのテストの置き場だから）。これで除外が消え、名指しの外のテストは構造的に消えない
     - ex-plan が運ぶ物: `TEST_TARGETS` と walk（ディレクトリは歩き、ファイルはそのまま取る。無い対象は飛ばす）／パターンは vitest の既定 include と同じ形（`.test.ts` / `.spec.ts` / `.test.tsx` など。ずれると「0本」が言えない）／`index.test.ts` の古い意図（プロダクトのテストが残る）／README 2枚の Getting started（いまは「`.pi/` の下のハーネスのテスト」）と「一度きり、プロダクトのテストを書く前に走らせる」／close.md の Integration の2ケース
     - 文面で受ける物: 足場はテストなしで残る（プロダクトが最初のテストを書いた時に初めて動く）／`passWithNoTests` でも「No test files found」は表示に残る（黙らない）／道具（5つの `.mjs`）は残す（一度きりの道具で、消すのはテストだけ）／空になったディレクトリは残る（git は追わない）／表示に「どの対象を歩いたか」を出す
     - Trial で確かめる物（ex-plan の Verify）: 名指しの3つを集める／`test/keep.test.ts` のような名指しの外は消えない（プロダクトのテストを食わない）／`node_modules` や `.git` のテストは歩かない／`.spec.ts` も拾う／無い対象は飛ばす／0本の写しで `test:run` が exit 0（`passWithNoTests`）／自己削除の後に0本・typecheck・lint・2回目の冪等／プロダクトが `test/tmp.ts` で最初のテストを書けること／実 repo の写しで30→0
     - `setupFiles` は0本の時には走らない（足場の副作用はプロダクトの最初のテストで初めて出る）。権限エラーなどで歩けないディレクトリは投げる（自分の repo なので場所が見えた方が良い）
3. Research: なし（`passWithNoTests` は vitest 4 の設定にあり、`test` の root オプション）
4. Trial: なし（014 のトライアルが、テスト0本で `vitest run` が exit 1・`vitest related` が exit 0 を実測している）
5. Decision: **accepted**

## 03: plan-skill

### 03-1: plan-skill

1. Agenda:
   - Title: plan の `read` チェックは、子が自分で読んで照合してよいか
   - Proposal: `.pi/skills/plan/SKILL.md` に一行足す（013 の close が `proposed` で残した物）
2. Highlight:
   - 013 の Slice 7 の Verify が `review` の子に README の照合をさせたが、worktree の `code` の子は consult の子を走らせられず、子は自分で読んで照合した
   - plan スキルは `read` を「a child reads a document and reports: which child, which document」と定め、`look`（a person reads a value）と分けている。**問題は誰が読むかではなく、その子が consult の子を走らせられないこと**（子は拡張もスキルも読まない）
   - owner の判断: `read` は子が自分で読んで照合してよい。独立の目が要るのは形や良し悪しの判断だが、そのために親がレビューを1回走らせるのは費用対効果が悪い。**親が acceptance で念のため読む**程度にする
   - 一行は `references/format.md` の `read` の定義と `SKILL.md` の Verify 手順に足す（実行主体は plan の子、consult の子が要るチェックは親が走らせる、親は acceptance で念のため読む）
3. Research: なし
4. Trial: なし
5. Decision: **accepted**
