# ADR 062

## 01: テストの除外を harness から切り離し、product-ready の設定だけで決められるか

### Research & Trial

- F1: vitest 5.0.5 の `test.exclude` は `string[]` で、既定は `['**/node_modules/**', '**/.git/**']` である。設定ファイルに `exclude` を書くと既定を置き換え、既定を残すには `configDefaults.exclude` を展開する。`test.include` の既定は `['**/*.{test,spec}.?(c|m)[jt]s?(x)']` である。出所: https://vitest.dev/config/exclude、https://vitest.dev/config/include、`node_modules/vitest/dist/chunks/defaults.B1FCaFfh.js:5-6`。
- F2: 現在の `vitest.config.ts` は、`testConfig(false)` で `exclude: [...configDefaults.exclude, ...harnessExcludes(readList(root))]` を返し、`testConfig(true)` では `exclude` を持たない。既定の export は `testConfig(false)` である。出所: `vitest.config.ts:24-41`。
- F3: `harnessExcludes` は `harness.json` の `copy` と `push` のすべての項目から `<rel>` と `<rel>/**` を作る。そのため現在の除外は copy 由来38件と push 由来18件の計56件で、`lib`、`scripts/checks`、`scripts/harness` などの重複を含む。出所: `scripts/harness/list/index.mjs:15-29`、`vitest.config.ts:36`。
- F4: `package.json` の `test`、`test:run`、`test:related` は ` --config vitest.starter.config.ts` を付ける。`vitest.starter.config.ts` は `testConfig(true)` を `defineConfig` に渡すだけである。出所: `package.json:10-12`、`vitest.starter.config.ts:1-3`。
- F5: 現在のテスト関係のファイルは、`scripts/harness` の7テスト、`scripts/checks` の3テスト、`scripts/product-ready` の3テスト、`.pi` 配下のテスト、`test/` の3ファイル（`temp-dir.ts`、`pi.fixture.ts`、`scripts.fixture.ts`）である。出所: `git ls-files`、各テストの import 行。
- `test/` の3ファイルは既定の `include` に一致しない。`*.fixture.ts` と `temp-dir.ts` は `*.test.*` でも `*.spec.*` でもないため、3ファイルを `exclude` に並べても収集対象の増減には寄与しない。漏れを防ぐには、それらを読むテストファイルを外すことになる。出所: `node_modules/vitest/dist/chunks/defaults.B1FCaFfh.js:5`、各テストの import 行。
- F7: `product:ready` は2回目に失敗する。1回 `--run` した後に再実行すると、`jobsFor` の `collectUnder` が `no paragraph under ### Product` を投げ、status 1 で終わる。`jobsFor` は表示、削除、書き換えより前なので、2回目は cycles、package.json、config、文書のいずれも変更しない。出所: `scripts/product-ready/index.mjs:139,213-241,318-324`、`scripts/product-ready/index.test.ts:265-275`。
- `product:ready` の cycles 削除と `vitest.starter.config.ts` 削除は、存在確認により2回目は何もしない。package.json の `--config` 除去は2回目に該当がないが、F7 の失敗により処理がそこに到達しない。出所: `scripts/product-ready/targets.mjs:146-167`、`scripts/product-ready/index.mjs:317,351-353`、`scripts/product-ready/targets.test.ts:139-146`。
- vitest の公式文書には、`exclude` にディレクトリを書いたときに配下のテストがすべて外れるか、`include` と `exclude` の両方に一致したときの優先順位が書かれていない。この2点は未確認である。出所: https://vitest.dev/config/exclude（2026-11-11 の取得）。
- `vitest.config.ts` の `root` は、設定ファイル自身のパスから求めている（`dirname(fileURLToPath(import.meta.url))`）。公式の既定は `process.cwd()` であり、`--root` を変えた場合に同じになるかは未実測である。出所: `vitest.config.ts:8-9`、https://vitest.dev/config/exclude。
- F11: `vitest.config.ts` は `harness.json` の `copy` に含まれる。出所: `scripts/harness/harness.json:14`。
- F12: trial consult-3 で、ディレクトリだけの除外（`scripts/harness`、`.pi`、`scripts/checks`、`scripts/product-ready`、`test/temp-dir.ts`、`test/pi.fixture.ts`、`test/scripts.fixture.ts` の7件）が、ハーネスのテストを漏れなく外した。既定の `include` と除外の両方に一致する `scripts/harness/index.test.ts` は、除外が勝って収集されなかった。収集件数は除外なしでは65件、候補Aでは0件だった。出所: consult-3（worktree `62-trial-vitest-exclude`、vitest 5.0.5、node v24.22.1）。

### Scope

- In:
  - refactor: テストの除外の材料を `product-ready` の JSON に移し、vitest の設定を1つにする。
  - format: `product-ready` の JSON の形と、`vitest.config.ts` の除外配列の形を決める。
  - naming: `product-ready` の JSON のファイル名とキー名を決める。
  - errors: 除外が効くことと、`product:ready` を2回実行したときの扱いを決める。
  - compatibility: `harness.json` の `copy` から `vitest.config.ts` を外し、README の記述を追従させる。
  - prose: `README.md` と `README.ja.md` から `vitest.starter.config.ts` の記述を消す。
- Out:
  - behaviour: `product:ready` の振る舞いを変えない（ハーネスのテストをスルーする振る舞いを保つため）。
  - dependency: 新しいパッケージは入れない（vitest の既存の設定で足りるため）。
  - speed: テストの実行時間は扱わない（除外の設定だけを変えるため）。
  - security: 秘密情報、権限、露出は扱わない（設定の除外だけを変えるため）。
  - deploy: 配布やリリースはしない（対象がないため）。
  - migration: 既存のプロダクトの設定は移行しない（このリポジトリのスターターの設定だけを変えるため）。
  - logs and monitoring: ログや監視は変えない（対象がないため）。

### Context

- C1: 現在の `pnpm test` は、`package.json` の3つのスクリプトが `--config vitest.starter.config.ts` を付けるため、すべてのテストを実行する（F4。前提）。
- C2: 現在のプロダクト用の除外は、`harness.json` の `copy` と `push` のすべての項目から56件を作る（F3。前提）。
- C3: オーナーは、テストの除外を `product-ready` の JSON で設定でき、`product:ready` が `vitest.config.ts` の除外配列を直接書き換える形を選んだ（オーナーの回答。制約）。
- C4: 除外の対象は、テストファイルだけでなく、fixture などのテスト関係すべてとする（オーナーの回答。制約）。
- C5: `product:ready` は2回目に失敗する（F7。制約）。このため、JSON を正として何度も適用する設計は成り立たない。
- C6: `vitest.config.ts` は `harness.json` の `copy` から外す（オーナーの回答。F11。制約）。
- C7: `product:ready` は、自分自身も JSON も消さない（オーナーの回答。制約）。
- C8: 026 の範囲に、029（プリンシプル違反の修正）と 028（不要テストの整理）を含めない（オーナーの回答。制約）。

### Decision

- Status: **accepted**
- Main: テストの除外が、`product-ready` の JSON の一覧と、`product:ready` による `vitest.config.ts` の除外配列の書き換えだけで決まる。
  - Add:
    - `scripts/product-ready/` の JSON に、テストの除外の一覧を置く（C3, C4, F5, F12）。
  - Update:
    - `vitest.config.ts` は、`configDefaults.exclude` と JSON の一覧を合成した `exclude` を持つ（C1, C3, F1, F12）。
    - `scripts/product-ready/index.mjs` は、JSON を読み、`vitest.config.ts` の `exclude` を書き換える（C3, F1）。
    - `harness.json` の `copy` から `vitest.config.ts` を外す（C6, F11）。
  - Drop:
    - `harnessExcludes` 関数（C2, F2, F3）。
    - `vitest.config.ts` の `scripts/harness` からの import（F2）。
    - `testConfig` の `harness` 引数による2分岐（F2）。
- Sub: `vitest.starter.config.ts` が消え、`package.json` のtest系の3スクリプトから `--config` が消える。
  - Update:
    - `package.json` の `test`、`test:run`、`test:related`（C1, F4）。
  - Drop:
    - `vitest.starter.config.ts`（F4）。
    - 3スクリプトの ` --config vitest.starter.config.ts`（F4）。
    - `scripts/product-ready/index.mjs` の `STARTER_FLAG`、`STARTER_CONFIG_AT`、`flaggedScripts`（C1, F4）。
    - `scripts/product-ready/cli.mjs` の `switchLines` の config 行（C1, F4）。
- Sub: 古いテスト設定の配線を固定していたテストが、新しい除外の書き換えを確かめる形に置き換わる。
  - Update:
    - `scripts/harness/config.test.ts` と `scripts/harness/list/index.test.ts`（F2, F3）。
    - `scripts/product-ready/cli.test.ts` と `scripts/product-ready/index.test.ts`（F4）。
    - `test/scripts.fixture.ts` の `configLine` と `scriptsLine`（F4）。
- Sub: `README.md` と `README.ja.md` から、`vitest.starter.config.ts` の記述が消える。
  - Update:
    - `README.md` と `README.ja.md` の `vitest.config.ts` の行と `product-ready` の行を、新しい形に合わせる（F4）。
  - Drop:
    - `README.md` と `README.ja.md` の `vitest.starter.config.ts` の行（F4）。
- Policy:
  - Allowed:
    - `product:ready` は `vitest.config.ts` の除外配列を書き換えてよい（C3）。
    - `product:ready` は、自分自身も JSON も残してよい（C7）。
    - `product:ready` は、JSON が空の配列なら、目印の間を空のままにする（C3）。
  - Forbidden:
    - `harness.json` の `copy` と `push` からテスト除外を導出する - 結合が戻るため（C6, F3）。
    - 2つ目の vitest 設定を持つ - `product:ready` の書き換えとスクリプトの書き換えが戻るため（C1, F4）。
    - `configDefaults.exclude` を書き換えの対象にする - `node_modules` と `.git` を常に除外するため（C3, F1）。
    - `vitest.config.ts` がテスト実行時に JSON を読む - JSON は入力であり、実行時に読むものではないため（C3, C5, F7）。
    - JSON を読めない、JSON でない、配列でない、要素が文字列でないときに書き換える - 中途半端な状態を残さないため（C3）。
    - 029 のプリンシプル違反の修正と 028 の不要テストの整理をこのエントリに含める - 別のロードマップ項目であるため（C8）。

#### Details

- `scripts/product-ready/test-exclude.json`
  ```json
  [
    "scripts/harness",
    ".pi",
    "scripts/checks",
    "scripts/product-ready",
    "test/temp-dir.ts",
    "test/pi.fixture.ts",
    "test/scripts.fixture.ts"
  ]
  ```
- `vitest.config.ts` の `test.exclude`
  ```ts
  import { configDefaults, defineConfig } from 'vitest/config';

  export default defineConfig({
    test: {
      exclude: [
        ...configDefaults.exclude,
        // product-ready: test-exclude start
        // product-ready: test-exclude end
      ],
    },
  });
  ```

### Definition

- `Unit.product-ready`(kept): 主機能（ハーネスのテストを外した状態に切り替え、プロダクト開発を始められる）は変わらない（除外の材料と書き換えの位置は経路であり、主機能に影響しないため）。
- `Unit.test-run`(kept): 主機能（壊れた振る舞いの指摘を受け取れる）は変わらない（どのテストを外すかの設定は経路であり、主機能に影響しないため）。
- `Unit.usage-readme`(kept): 主機能（このスターターの使い方を読むことができる）は変わらない（README のテスト設定の記述の追従は経路であり、主機能に影響しないため）。
- `Stack.Checks.Test runner`(kept): vitest のままである（除外の設定だけを変えるため）。

## 02: ハーネス同期のフォルダとスクリプトを harness-sync に揃えられるか

### Research & Trial

- F1: `package.json` の `harness:pull` と `harness:push` は、`node scripts/harness/index.mjs pull` と `node scripts/harness/index.mjs push` を呼ぶ。出所: `package.json:7-8`。
- F2: `scripts/harness` 配下には14ファイルがある。出所: `git ls-files scripts/harness`。
- F3: `harness.json` の `copy` と `push` は、`scripts/harness/*.mjs`、`scripts/harness/*.test.ts`、`scripts/harness/*/*.mjs`、`scripts/harness/*/*.test.ts` の4つのパターンをそれぞれ持つ。`.json` はこの4つのパターンに一致しないため、`harness.json` 自身は運搬対象外である。出所: `scripts/harness/harness.json:19-22,27-30`。
- F4: `scripts/harness/list/index.mjs:37` は `path.join(root, 'scripts', 'harness', 'harness.json')` で一覧を読む。出所: `scripts/harness/list/index.mjs:37`。
- F5: `scripts/harness/index.test.ts:26` は `SCRIPT = join(process.cwd(), 'scripts', 'harness', 'index.mjs')` を持ち、`index.test.ts:63,164` と `list/index.test.ts:30,43,49,55,62` は fake root に `scripts/harness/harness.json` を書く。出所: 各ファイルのその行。
- F6: `vitest.config.ts:4` は `./scripts/harness/list/index.mjs` から `harnessExcludes` と `readList` を import する。出所: `vitest.config.ts:4`。
- F7: `.pi/skills/plan/references/design.md:25` は、`test/` のファイルを `scripts/harness/harness.json` の `copy` に名指しする規則を持つ。出所: `.pi/skills/plan/references/design.md:25`。
- F8: `README.md:59` と `README.ja.md:59` は `harness-sync: scripts/harness/*` と書く。ラベルは `harness-sync`、パスは `scripts/harness` である。出所: `README.md:59`、`README.ja.md:59`。
- F9: `DEFINITION.md:58` の Unit 名は `harness-copy` であり、その行は「オーナーが、スターターのハーネスをプロジェクトへ取り込み、プロジェクトのハーネスをスターターへ戻せる」である。出所: `DEFINITION.md:58`。
- F10: 過去の049サイクルは `naming: in` で「キー名を `starter`、`copy`、`push` に決める。`Unit.harness-copy` の名前は変えない」と決め、Definition でも `Unit.harness-copy`(kept) と書いた。出所: `cycles/archive/261101-049-feat-harness-sync/adr.md:18,77`。
- F11: 過去の049サイクルには、フォルダ名、`harness.json` のファイル名、スクリプト名を `harness-sync` に変える決定はない。`harness-sync` はサイクルのブランチ名 `feat-harness-sync` に現れる。出所: `cycles/archive/261101-049-feat-harness-sync/`、`git grep`。
- F12: `scripts/checks/typecheck-staged.mjs` の `HARNESS_DIRS` は `scripts/checks/scopes.json` を読み、`scopes.json` の値は `[".pi"]` である。`HARNESS_DIRS` は `scripts/harness` を指さない。出所: `scripts/checks/typecheck-staged.mjs:11-16,49-54`、`scripts/checks/scopes.json:1`。
- F13: `scripts/product-ready` の `.mjs` に `harness:pull`、`harness:push`、`scripts/harness` の参照はない。出所: `git grep`。
- F14: `test/` の3ファイル（`temp-dir.ts`、`pi.fixture.ts`、`scripts.fixture.ts`）に `scripts/harness` の文字列はない。出所: `git grep`。

### Scope

- In:
  - naming: `scripts/harness`、`harness.json`、`harness:pull`、`harness:push`、`Unit.harness-copy` の新しい名前を決める。
  - refactor: `scripts/harness` のフォルダを `scripts/harness-sync` に移し、import とテストの実行パスを追従させる。
  - compatibility: 現在のコード、設定、文書、スキルにある旧名の参照を追従させ、過去の `cycles/` の記録は変えない。
  - prose: `README.md`、`README.ja.md`、`.pi/skills/plan/references/design.md`、`DEFINITION.md` の旧名の記述を新しい名前にする。
  - errors: 改名後も `harness:pull`、`harness:push`、各テストが新しいパスで動くことを確かめる。
- Out:
  - behaviour: pull と push の振る舞いを変えない（名前だけを変えるため）。
  - format: `harness.json` の中身の形を変えない（値のパスだけを変えるため）。
  - dependency: 新しいパッケージは入れない（名前の変更だけのため）。
  - speed: 同期の速度は扱わない（名前の変更だけのため）。
  - security: 秘密情報、権限、露出は扱わない（名前の変更だけのため）。
  - deploy: 配布の仕組みを変えない（`harness:pull` と `harness:push` の経路はそのままのため）。
  - migration: 既存のプロダクトの `package.json` のスクリプトは移行しない（このリポジトリのスターターの名前だけを変えるため）。
  - logs and monitoring: ログや監視は変えない（対象がないため）。

### Context

- C1: `scripts/harness` 配下には14ファイルがあり、`package.json` の `harness:pull` と `harness:push` は `node scripts/harness/index.mjs pull` と `node scripts/harness/index.mjs push` を呼ぶ（F1, F2。前提）。
- C2: `harness.json` の `copy` と `push` は `scripts/harness` の4つのパターンを持ち、`harness.json` 自身は拡張子が `.json` のため運搬対象外である（F3。前提）。
- C3: `scripts/harness/list/index.mjs:37` は `scripts/harness/harness.json` を読む（F4。前提）。
- C4: テストは `scripts/harness` のパスを直接持ち、`index.test.ts:26`、`index.test.ts:63,164`、`list/index.test.ts:30,43,49,55,62` がある（F5。前提）。
- C5: `.pi/skills/plan/references/design.md:25` は `scripts/harness/harness.json` を名指しする（F7。前提）。
- C6: `README.md:59` と `README.ja.md:59` のラベルは `harness-sync`、パスは `scripts/harness` である（F8。前提）。
- C7: `DEFINITION.md:58` の Unit 名は `harness-copy` であり、過去の049サイクルはこの名前を変えないと決めた（F9, F10。制約）。
- C8: 過去の049サイクルには、フォルダ名、`harness.json` のファイル名、スクリプト名を `harness-sync` に変える決定はない。`harness-sync` はサイクルのブランチ名に現れる（F11。前提）。
- C9: `scripts/checks/typecheck-staged.mjs` の `HARNESS_DIRS` は `.pi` を指し、`scripts/harness` を指さない（F12。前提）。
- C10: `scripts/product-ready` と `test/` の3ファイルに `scripts/harness` の参照はない（F13, F14。前提）。
- C11: オーナーは、改名の対象にスクリプト名も入れ、関連するものの追従も行うことを選んだ（オーナーの回答。制約）。
- C12: オーナーは、既存のプロダクトの `package.json` のスクリプトは移行しないことを選んだ（オーナーの回答。制約。Scope の `migration: out`）。
- C13: オーナーは、過去の `cycles/` の記録は変えないことを選んだ（オーナーの回答。制約。Scope の `compatibility`）。
- C14: エントリ 01 が `vitest.config.ts` から `scripts/harness/list/index.mjs` の import を取り除くため、エントリ 02 はその import を追従させない（エントリ 01 の Decision。制約）。

### Decision

- Status: **accepted**
- Main: ハーネス同期が、フォルダ、JSON ファイル、`pnpm` のスクリプト、`DEFINITION.md` の Unit 名のすべてで `harness-sync` に揃う。
  - Add:
    - `scripts/harness-sync` のフォルダ（C1, C8, C11, F1, F2, F11）。
    - `scripts/harness-sync/setting.json` のファイル（C2, F3）。
    - `package.json` の `harness-sync:pull` と `harness-sync:push`（C1, C11, F1）。
    - `DEFINITION.md` の `Unit.harness-sync`（C7, F9, F10）。
  - Update:
    - `setting.json` の `copy` と `push` の4つのパターンを `scripts/harness-sync` に変える（C2, F3）。
    - `scripts/harness-sync` のコードのコメントと、`list/index.mjs` の `setting.json` の読み込み先（C3, F4）。
    - `README.md`、`README.ja.md`、`.pi/skills/plan/references/design.md`、`DEFINITION.md` の旧名（C5, C6, F7, F8, F9）。
  - Drop:
    - `scripts/harness` のフォルダ（C1, F2）。
    - `harness.json` のファイル名（F3, F4）。
    - `package.json` の `harness:pull` と `harness:push`（C1, F1）。
    - `DEFINITION.md` の `Unit.harness-copy`（C7, F9, F10）。
- Sub: `scripts/harness-sync` のテストが、新しいパスで同じ振る舞いを確かめる。
  - Update:
    - `scripts/harness-sync/index.test.ts` と `scripts/harness-sync/list/index.test.ts` の `SCRIPT` と fake root のパス（C4, F5）。
- Policy:
  - Allowed:
    - `scripts/harness`、`harness.json`、`harness:pull`、`harness:push`、`Unit.harness-copy` を `harness-sync` に変えてよい（C11）。
  - Forbidden:
    - 過去の `cycles/` の記録を変える - 当時の名前の記録であるため（C13）。
    - 既存のプロダクトの `package.json` のスクリプトを移行する - このリポジトリのスターターの名前だけを変えるため（C12）。
    - `scripts/checks/scopes.json` と `HARNESS_DIRS` を変える - いずれも `scripts/harness` を指さないため（C9, F12）。
    - `scripts/product-ready` と `test/` を変える - `scripts/harness` の参照がないため（C10, F13, F14）。
    - pull と push の振る舞いを変える - 名前だけを変えるため（C1, F1）。
    - `setting.json` の `copy` と `push` の形を変える - 値のフォルダ名だけを変えるため（C2, F3）。
    - `vitest.config.ts` を追従させる - エントリ 01 が `scripts/harness` からの import を取り除くため（C14, F6）。

#### Details

- `scripts/harness-sync` のフォルダと `setting.json`

  ```text
  scripts/harness-sync
  scripts/harness-sync/setting.json
  ```

- `package.json` の2つのスクリプト

  ```json
  "harness-sync:pull": "node scripts/harness-sync/index.mjs pull",
  "harness-sync:push": "node scripts/harness-sync/index.mjs push"
  ```

- `setting.json` の `copy` と `push` の4つのパターン

  ```text
  scripts/harness-sync/*.mjs
  scripts/harness-sync/*.test.ts
  scripts/harness-sync/*/*.mjs
  scripts/harness-sync/*/*.test.ts
  ```

- `DEFINITION.md` のUnitの行

  ```md
  - harness-sync: オーナーが、スターターのハーネスをプロジェクトへ取り込み、プロジェクトのハーネスをスターターへ戻せる
  ```

- `README.md`、`README.ja.md`、`.pi/skills/plan/references/design.md` のパス
  ```text
  scripts/harness-sync/*
  scripts/harness-sync/setting.json
  ```

### Definition

- `Unit.harness-copy`(dropped): なし（名前を `harness-sync` に変える）。
- `Unit.harness-sync`(added): オーナーが、スターターのハーネスをプロジェクトへ取り込み、プロジェクトのハーネスをスターターへ戻せる。
- `Unit.usage-readme`(kept): 主機能（このスターターの使い方を読むことができる）は変わらない（README のパスの追従は経路であり、主機能に影響しないため）。
- `Unit.plan-skill`(kept): 主機能（1 plan分の作業の形と順序を決めて書ける）は変わらない（`.pi/skills/plan/references/design.md` のパスの追従は経路であり、主機能に影響しないため）。
