# ADR 034

## 01: git を起動する保証をテストからコードへ移し、実 git のテストとテストの足場をやめるか

### Context

- 2026-09-27、フック（lefthook）の中でテストが git を起動し、継承した `GIT_*`（`GIT_INDEX_FILE` など）のため、`cwd` の一時ディレクトリではなく本体リポジトリに commit・tag・config が書かれた。git は exit 0 を返し、エラーは出なかった（`test/setup.ts:1-10` がこの事故の記録）。
- 対処は 2 つ入った。コード側は `lib/git-env.mjs` の `gitEnv()` が `GIT_*` を落とすこと。テスト側は `test/setup.ts` がプロセスの環境を切ること。
- 事故の種類は「静かな失敗」なので、利用でも e2e でも見つからない。頻度を上げても解けない。解けるのは構造だけ。
- コードは既に失敗時に投げる（`consult/run/worktree.ts:209-214`、`:369-374`、`:98-101`）。事故の当時、投げるべきエラーは無かった。
- 現在 git を起動するテストは 2 ファイル。`consult/run/worktree.test.ts`（37 本）と `consult/tool/worktree.test.ts`（18 本）。
- `consult/run/git-env.ts` の import 元はこの 2 ファイルだけ。
- `test/setup.ts` は元は `.pi/test/` にあり、`.pi` がプロダクトで exclude されるため直下の `test/` へ移された（b98c927）。つまり直下の `test/` は原因ではなく、最後の結果。
- `harness.json` の `copy` に `test/setup.ts`、`test/tmp.ts`、`test/env.test.ts` が入る。`copy` は同時に除外の一覧でもあるので、プロダクトでは `test/env.test.ts` が走らない。警報だけが死に、足場だけが残る。
- git を起動する道は 3 か所に分かれ、すべてが `gitEnv()` を通す規約になっている（`consult/run/worktree.ts:65`、`consult/run/run.ts:154`、`.pi/skills/adr/scripts/scaffold.mjs:197`）。4 か所目を書いた人が忘れれば同じ事故が戻る。
- owner の求めは 2 つ。実 git のテストをやめること。事故の種類を構造から消すこと。
- 分かっていないこと: 無し。

### Decision

- Status: **accepted**
- Adopted:
  - A: 保証をコードへ移す。git を起動する口を `lib/` の 1 つにまとめ、`gitEnv()` の適用を規約ではなく構造にする。実 git のテスト 2 ファイルと `consult/run/git-env.ts` を削除し、`worktree.ts` の論理は `GitRun` 型の偽物で試す。`test/setup.ts`、`test/env.test.ts`、`test/README.md` を削除する。
- Options:
  - B: 保証をコードへ移し、契約テストを数本だけ実 git で残す（理由: 実 git が残る限り `test/setup.ts` と `GIT_*` の継承経路も残る。契約の破れは consult の利用時に大声で落ちるので、常設の検査にする価値が無い）
  - C: 現状維持（理由: 事故の種類が構造に残る。テストの本数も足場も減らない）

### Scope

- 変更:
  - out: behaviour（理由: consult の振る舞いは変えない。`Users can do` の行は動かない）
  - in: refactor。git を起動する道を `lib/` の 1 関数にまとめ、3 か所（`consult/run/worktree.ts`、`consult/run/run.ts`、`.pi/skills/adr/scripts/scaffold.mjs`）をそこへ通す。実 git のテスト 2 ファイルと `consult/run/git-env.ts` を削除し、論理は `GitRun` 型の偽物で試す（`consult/tool/commit.test.ts` と同じ形）。`test/setup.ts`、`test/env.test.ts`、`test/README.md` を削除し、`test/tmp.ts` を `test/temp-dir.ts` に改名して `tempDir(prefix = 'test-')` にする。使う 25 ファイルの import を書き換える。`vitest.config.ts` の `setupFiles` を外し、`harness.json` の `copy` を `test/temp-dir.ts` の 1 行にする。テストはこの作業で増やさない。型・スキーマ・仕様で保証される前提を再現するテストは書かず、起きにくく影響が無視できる物は削る。e2e も手動の手順も足さない。
  - out: dependency（理由: 足す物も外す物も無い）
  - out: naming（理由: `Who` が見る語は増えない。内部の関数名は refactor の中で決める）
  - out: format（理由: 記録・目録・設定ファイルの形は変えない。`harness.json` は行を減らすだけで形は同じ）
  - in: prose。`test/README.md` を消し、`.pi/extensions/consult/README.md:219,248-249` の「check が git の置き場を自分で決める」記述を、起動口が 1 つになった形に合わせる。
- 品質:
  - out: speed（理由: 目的ではない。実測で実 git の寄与は壁時計 0.5 秒程度。再訪条件: テスト全体の時間そのものが議題になったら in）
  - out: security（理由: 外へ出す secrets や外部入力は増えない。`GIT_*` を落とすのは security ではなく errors の側）
  - out: compatibility（理由: 読む物の形は変えない。git の版による差は契約テストで見なくなり、利用時に受け取る）
  - in: errors。`gitEnv()` の適用漏れを構造で塞ぎ、誤った環境で別のリポジトリに書く道を無くす。失敗時に投げる形は既にあるので変えない。
- 運用:
  - out: deploy（理由: 配る手順が無い）
  - out: migration（理由: 移すデータが無い。テストの足場は消すだけで、既存の記録は読まない）
  - out: logs and monitoring（理由: ローカルの道具で、失敗は利用時に表面化する。監視の層を持たない）

### Research & Trial

- 全テストは 53 ファイル 844 本。壁時計 4.91 秒（同じ機械で 5.92 秒の回もあり、ばらつく）。
- 実 git の 2 ファイルだけを回すと 3.48 秒。全テストから実 git の 2 ファイルを外すと 4.38 秒。実 git と `tsc` と `node` を起動する 6 ファイルを外すと 3.69 秒。実 git の壁時計への寄与は 0.5 秒程度で、重さの主因ではない。
- テストから git を起動するのは 2 ファイルだけ。`scripts/` 側が起動するのは `node` と `tsc` で、その先も git を起動しない。
- `spawnSync('git'` は 3 か所。3 か所とも `gitEnv()` を通す。
- `gitEnvFor` / `runGit` の import 元はテスト 2 ファイルのみ。
- `test/tmp.ts` は 25 ファイルが import する。
- `harness.json` の `copy` の `test/*` 3 行は、`harnessExcludes` によりプロダクトの `exclude` にもなる。プロダクトでは `test/env.test.ts` が走らない。
- 検出の速さは利用の頻度ではなく、失敗の返り方で決まる。大声で落ちる失敗は利用がそのまま検出手段になり、静かな失敗は構造でしか解けない。

### Definition

- `Unit.subagent-consult`(kept): コンサルを走らせ、作業場と結果を扱う機能は変わらない。変わるのは git を起動する道と、それを保証する場所。
- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取る機能は変わらない。変わるのはテストの本数と足場。
- `Unit.harness-copy`(kept): スターターとプロジェクトの間でハーネスを往復させる機能は変わらない。変わるのは渡す一覧の中身。
- `Unit.product-ready`(kept): ハーネスのテストを外した状態に切り替える機能は変わらない。外す対象が減るだけ。
- `Unit.agent-rules`(kept): 毎セッション同じ規則を読む機能は変わらない。テストの指針はこの entry の作業の基準として使い、置き場は決めない。
- `Stack.Checks.Test runner`(kept): vitest のまま。設定から `setupFiles` が外れるが、役割は同じ。
