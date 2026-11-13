# ADR 067

## 01: quality-gate のファイルを gate/ に集め、テストの前提を 1 つの setup に寄せられるか

Type: _Full_

### Context

- C1: このサイクルは `ROADMAP.md` 028（0.9.6、不要テストの整理）を扱い、`memo-test.md` 5.2 の 5 番目「小さな Unit」を実行する。エントリは 01〜03 の順に議論する。01 は quality-gate と sound-notify のテストの前提を扱う。オーナーは 5 番目を先に進めることを認めた。
- C2: `quality-gate/checks.test.ts` は、9 か所で `tempDir()`、`tsFile()`、`fakePi()` を組み立てる。内訳は `assertNoExclusion` の中の 1 か所と、8 つの `it` である。`fakePi()` は `pi`、`calls`、`setCheckIgnoreCode`、`setIgnoredStdout`、`setScriptResult`、`setAllPnpm` を持つ `FakePi` を返す。
- C3: `sound-notify/index.test.ts` では、7 つの `describe` がそれぞれ `played` と `setPlayer` の `beforeEach` と `afterEach` を持つ。`createEntry` と `entryWithFile` は、同じ形の `recordingPi` を別々に組み立てる。
- C4: `memo-test.md` 1.4-3 は、fixture を「その Unit だけで使うものは Unit 内の `*.fixture.ts`、複数 Unit で使うものは `test/`」に置き、テストの前提を組み立てる helper も fixture に含めると決めた。
- C5: `memo-test.md` 4.4 は、`checks.test.ts` の `tempDir()`、`tsFile()`、`fakePi()` を「1 つの setup にする」、`sound-notify` の `played` と `setPlayer` を「`beforeEach` に寄せる」、`recordingPi` の記録を「1 つに寄せる」としている。
- C6: 028 は振る舞いを変えない。テストが確かめる事実も製品コードも変えない。
- C7: このエントリの問いは、quality-gate と sound-notify のテストの前提を、1 つの setup に寄せられるか。
- C8: オーナーは、quality-gate のファイルを 1 つのフォルダに集めることを認め、フォルダ名を `gate/` と決めた（2026-11-13 の回答）。

### Research & Trial

- F1: 既存の `*.fixture.ts` は、値を組み立てる関数を export し、テストは `it` の中で毎回呼ぶ。`consult.fixture.ts` の `aTypePolicy`、`aConsultOptions`、`aRunRecord`、`aWidgetUI`、`scrub.fixture.ts` の `degenerate`、`assistantMessage`、`collect.fixture.ts` の `planDoc`、`test/pi.fixture.ts` の `piUsage`、`test/scripts.fixture.ts` の `statusLine` がその形である。出所: `.pi/extensions/consult/consult.fixture.ts:19-76`、`.pi/extensions/thinking-scrub/scrub.fixture.ts:20-64`、`.pi/skills/close/scripts/collect.fixture.ts:17-23`、`test/pi.fixture.ts:14-23`、`test/scripts.fixture.ts:41-83`
- F2: `context-precompact` は `test/session-entries.ts` に `createSessionFixture()` を置き、呼ぶたびに `seq` と `latest` のクロージャを作る。`turns(count)` は毎回新しい配列を返す。`index.test.ts` の各 `it` は先頭で `createSessionFixture()` と `turns(3)` を呼び、`beforeEach`/`afterEach` を持たない。出所: `.pi/extensions/context-precompact/test/session-entries.ts:119-156`、`.pi/extensions/context-precompact/index.test.ts:258-260,722-724`
- F3: `sound-notify/index.test.ts` の `createEntry` と `entryWithFile` は、どちらも `handlers` の `Map` と `calls` の配列を持つ `recordingPi` を新しく作り、`{handlers, calls}`（`entryWithFile` は `dir` も）を返す。違いは、`createEntry` が `registerSoundHandlers(recordingPi, config)` を呼び、`entryWithFile` が `settings.json` を書いて `entry(recordingPi, dir)` を呼ぶことである。出所: `.pi/extensions/sound-notify/index.test.ts:68-119`
- F4: 調べたファイルの中では、fixture の値や偽物を `beforeEach`/`afterEach` で共有している例は、`sound-notify/index.test.ts` の 7 か所（`played` と `setPlayer`）と、`consult/index.test.ts:92-106`（`vi.useFakeTimers`、`setSoundEnabled`、`setPlayer`、`stopTick`）だけである。出所: `.pi/extensions/sound-notify/index.test.ts:122-134,155-168,182-194,248-260,269-281,292-304,345-357`、`.pi/extensions/consult/index.test.ts:92-106`
- F5: `quality-gate/checks.test.ts` の `fakePi()` は、`calls`、`checkIgnoreCode`、`ignoredStdout`、`defaultPnpm`、`overrides` のクロージャを新しく作り、`{pi, calls, setCheckIgnoreCode, setIgnoredStdout, setScriptResult, setAllPnpm}` を返す。`tsFile(dir, name)` は実ファイルを 1 件作り、絶対パスを返す。`assertNoExclusion(code)` は、内部で `tempDir()`、`tsFile`、`fakePi()` を新しく作る。各 `it` は 3 つをそれぞれ呼び、`beforeEach`/`afterEach` を持たない。出所: `.pi/extensions/quality-gate/checks.test.ts:41-106,120-256`
- F6: `test/pi.fixture.ts` は `piUsage()` を export し、呼ぶたびに `cost` を含む新しいオブジェクトを返す。`scrub.fixture.ts` はこれを `assistantMessage()` の中で呼ぶ。`test/scripts.fixture.ts` は文字列を組み立てる関数だけを export し、テストは `expect` の引数の中で呼ぶ。出所: `test/pi.fixture.ts:14-23`、`.pi/extensions/thinking-scrub/scrub.fixture.ts:51-64`、`test/scripts.fixture.ts:41-83`

### Scope

- In:
  - structure: `quality-gate/checks.ts`、`quality-gate/report.ts`、`quality-gate/targets.ts` とそれぞれのテストを `quality-gate/gate/` に集め、`gate/checks.fixture.ts` を置く。`sound-notify/index.test.ts` の前提は `sound-notify/index.fixture.ts` に移す。
  - expression: 移した helper の名前と、新しい fixture の説明を、`gate/` と `sound-notify` の置き場所に合わせる。
  - downstream: `quality-gate/index.ts` の import を `./gate/...` に直す。`gate/checks.fixture.ts` が `test/temp-dir.ts` を読み込み、`gate/targets.test.ts` から `test/temp-dir.ts` を指す相対パスを 1 つ深くする。`sound-notify/index.test.ts` の呼び出しを直す。
  - verification: 移した後も、`pnpm test:run` で対象の 47 件を含むすべてのテストが成功し、`pnpm typecheck` と `pnpm lint` が通ることを確かめる。
- Out:
  - result: 製品の外から見える振る舞いを変えない（テストだけを扱う）。
  - logic: 製品の判断、手順、規則を変えない（テストの前提の組み立てだけを扱う）。
  - upstream: 外部パッケージを足さない、更新しない、削除しない。
  - existing: 既存のデータ、インストール済みのバージョン、配布済みの文書を移さない。
  - cost: 実行時間、資源、API 呼び出しを変えない（テストごとに前提を作る回数は同じ）。
  - safety: 秘密、権限、公開、個人データを扱わない。
  - failure: テストの失敗の扱いと、製品の失敗時の振る舞いを変えない（断言を変えない）。
  - observability: ログ、メトリクス、監査記録を変えない。
  - release: 配布の仕方、適用の仕方、戻し方を変えない。
  - other: 上のどれにも当たらない関心はない。

### Decision

- Status: **accepted**
- Main: quality-gate のファイルが `gate/` に集まり、quality-gate と sound-notify のテストが前提を Unit 内の `*.fixture.ts` による 1 つの setup から受け取る（C1, C7, C8, F1）
  - Add:
    - `quality-gate/gate/checks.fixture.ts` に `checksSetup()` を置く。`checksSetup()` は、新しい一時ディレクトリと、その中のファイルを作る関数と、`fakePi()` を返す（C2, C5, C8, F1, F5）
    - `sound-notify/index.fixture.ts` に `recordingPi()` を置く。`recordingPi()` は、`handlers` の `Map` と `calls` の配列を持つ `EntryPiPort` を作り、その 2 つを `{pi, handlers, calls}` として返す（C3, F3）
  - Update:
    - `quality-gate/checks.ts`、`quality-gate/report.ts`、`quality-gate/targets.ts` と、それぞれのテストを `quality-gate/gate/` に移す。`quality-gate/index.ts` の import を `./gate/...` に直す（C8）
    - `quality-gate/gate/checks.test.ts` の 9 か所を、`checksSetup()` が返す `dir`、`tsFile`、`fake` を使う形にする。`assertNoExclusion` は内部で `checksSetup()` を呼ぶ（C2, C5, F5）
    - `quality-gate/gate/checks.fixture.ts` が `test/temp-dir.ts` を読み込み、`quality-gate/gate/targets.test.ts` から `test/temp-dir.ts` を指す相対パスを 1 つ深くする（C8）
    - `quality-gate/gate/checks.fixture.ts` と `sound-notify/index.fixture.ts` に、何を組み立てる fixture かを説明するコメントを置く。`gate/checks.test.ts` と `index.test.ts` の冒頭コメントに、前提の場所を 1 文加える（C4, C8）
    - `sound-notify/index.test.ts` の 7 つの `describe` の `played`、`beforeEach`、`afterEach` を、ファイル先頭の 1 組にまとめる（C3, F4）
    - `sound-notify/index.test.ts` の `createEntry` と `entryWithFile` を、`recordingPi()` を使う形にする（C3, F3）
  - Drop:
    - `quality-gate` のルート直下の `checks.ts`、`checks.test.ts`、`report.ts`、`report.test.ts`、`targets.ts`、`targets.test.ts` をなくす（C8）
    - `gate/checks.test.ts` の中の `fakePi()`、`tsFile()` の定義を `checks.fixture.ts` に移す（C5, F5）
    - `sound-notify/index.test.ts` の中の `recordingPi` の定義 2 つを、`index.fixture.ts` の `recordingPi()` に置き換える（C3, F3）
- Sub: なし
- Policy:
  - Allowed:
    - 1 つの Unit だけで使う fixture を、その Unit の `*.fixture.ts` に置く（C4）
    - 前提を組み立てる関数を、呼ぶたびに新しい値を返す形にする（F1, F2, F5, F6）
    - `played` と `setPlayer` を、ファイル先頭の 1 組の `beforeEach`/`afterEach` にまとめる（F4）
    - `quality-gate` の 3 つの実装とテストを `gate/` に集め、入口の `index.ts` をルートに残す（C8）
  - Forbidden:
    - テストの間で値を持ち越さない - 持ち越すとテストが順序に依存するため（F1, F2, F5）
    - テストの断言と製品コードを変えない - 028 は振る舞いを変えない（C6）
    - 複数 Unit で使わない fixture を `test/` に置かない - メモ 1.4-3 の置き場所に反する（C4）
    - `quality-gate/index.ts` を `gate/` に動かさない - pi がこのパスを入口として読み込む（C8）

#### Details

- `checksSetup()` の形

  ```ts
  export interface ChecksSetup {
    readonly dir: string;
    readonly tsFile: (name: string) => string;
    readonly fake: FakePi;
  }

  export function checksSetup(): ChecksSetup {
    const dir = tempDir();
    return {
      dir,
      tsFile: (name) => tsFile(dir, name),
      fake: fakePi(),
    };
  }
  ```

- `recordingPi()` の形

  ```ts
  import type { EntryPiPort } from './index.ts';

  export interface RecordingPi {
    readonly pi: EntryPiPort;
    readonly handlers: Map<string, (...args: unknown[]) => unknown>;
    readonly calls: Array<{ command: string; args: string[] }>;
  }

  function isHandler(value: unknown): value is (...args: unknown[]) => unknown {
    return typeof value === 'function';
  }

  export function recordingPi(): RecordingPi {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const calls: Array<{ command: string; args: string[] }> = [];
    const pi: EntryPiPort = {
      on: (...args: unknown[]) => {
        const [event, handler] = args;
        if (typeof event === 'string' && isHandler(handler)) {
          handlers.set(event, handler);
        }
        return () => undefined;
      },
      exec: async (command: string, args: string[]) => {
        calls.push({ command, args });
        return undefined;
      },
    };
    return { pi, handlers, calls };
  }
  ```

- `played` と `setPlayer` の 1 組
  ```ts
  const played: string[] = [];
  let restorePlayer: () => void;

  beforeEach(() => {
    played.length = 0;
    restorePlayer = setPlayer(async (_pi, soundName) => {
      played.push(soundName);
    });
  });

  afterEach(() => {
    restorePlayer();
  });
  ```

### Definition

- `Unit.quality-gate`(kept): そのターンの変更分に対する検査結果を返すという主機能は変わらず、ファイルの置き場所とテストの前提の作り方だけが変わる。
- `Unit.sound-notify`(kept): pi からの通知と commit に気づくという主機能は変わらず、テストの前提の作り方だけが変わる。
- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取るという主機能は変わらず、テストのファイルの置き場所と前提の作り方だけが変わる。
- `Stack.Checks.Test runner`(kept): vitest のままで、テストのファイルの置き場所が変わるだけである。

## 02: quality-gate の targets.test.ts の説明を、実態に合わせられるか

Type: _Simple_

### Context

- C1: このサイクルは `ROADMAP.md` 028（0.9.6、不要テストの整理）を扱い、`memo-test.md` 5.2 の 5 番目「小さな Unit」を実行する。エントリは 01〜03 の順に議論する。02 は、01 で `gate/` に移す `quality-gate/gate/targets.test.ts` の説明を扱う。
- C2: `targets.test.ts:7` は「porcelain の解析と差分だけを試す」と書いている。このファイルは `parseStatus`、`changedSince`、`fingerprint`、`filterByExtensions` を試し、`git` の起動は試さない。01 の決定後は `quality-gate/gate/targets.test.ts` になる。
- C3: 028 は振る舞いを変えない。このエントリは説明だけを扱い、テストの断言は変えない。
- C4: `memo-test.md` 4.2 は、この説明について「文言を直す」としている。
- C5: このエントリの問いは、`targets.test.ts` の説明を実態に合わせられるか。

### Research & Trial

- F1: `targets.test.ts` は `parseStatus`、`changedSince`、`fingerprint`、`filterByExtensions` を試し、`git` の起動は試さない。冒頭の説明は「porcelain の解析と差分だけを試す」と書いている。出所: `.pi/extensions/quality-gate/targets.test.ts:7,28-85`

### Scope

_omission_

### Decision

- Status: **accepted**
- Main: `targets.test.ts` の冒頭の説明が実際に試している範囲（`parseStatus`、`changedSince`、`fingerprint`、`filterByExtensions`）と一致し、`git` の起動は試さないことが読み取れる（C1, C2, C4, C5, F1）
  - Add:
    - なし
  - Update:
    - 冒頭の説明を「porcelain の解析、差分、指紋、拡張子の絞り込みを試す。`git` の起動は試さない。」に直す（C2, C4, F1）
  - Drop:
    - なし
- Sub: なし
- Policy:
  - Allowed:
    - 説明に、試している関数の名前を書く（C2, F1）
    - 表題とテストの断言は変えない（C3）
  - Forbidden:
    - テストの断言を変えない - 028 は振る舞いを変えない（C3）
    - `git` を起動するテストを足さない - 実リポジトリが要るため、このエントリの範囲外である（C2）

#### Details

_omission_

### Definition

- `Unit.quality-gate`(kept): そのターンの変更分に対する検査結果を返すという主機能は変わらず、テストの説明だけが変わる。

## 03: vitest.config.test.ts から、振る舞いを持たない定数確認を削除できるか

Type: _Full_

### Context

- C1: このサイクルは `ROADMAP.md` 028（0.9.6、不要テストの整理）を扱い、`memo-test.md` 5.2 の 5 番目「小さな Unit」を実行する。エントリは 01〜03 の順に議論する。03 は `vitest.config.test.ts` を扱う。
- C2: `vitest.config.test.ts` の 1 本目は、`configDefaults.exclude` の後ろに目印の間の一覧が並ぶことと、`reporters` の値を確かめる。`markerList()` は `vitest.config.ts` を読み込み、目印の間の文字列を集める。
- C3: 2 本目は、`TEST_VERBOSE` の有無で `reporters` が切り替わることと、`passWithNoTests` が `true` のままであることを確かめる。`passWithNoTests` の断言は、`vitest.config.ts:15` の値を写すだけである。
- C4: `memo-test.md` 6.1-3 は 1 本目の削除を決めた。`memo-test.md` 4.6 は 2 本目を「振る舞いを持つ」として残す。`memo-test.md` 1.4-2 は「実装の値を写すだけの定数確認は削除する」と決めた。
- C5: 1 本目を削除すると、`markerList()` や `readFileSync`、`dirname`、`join`、`fileURLToPath`、`configDefaults`、既定 import の `config` が未使用になる。
- C6: 028 は振る舞いを変えない。このエントリでは `vitest.config.ts` の値も変えない。
- C7: このエントリの問いは、`vitest.config.test.ts` から、振る舞いを持たない定数確認を削除できるか。

### Research & Trial

- F1: `vitest.config.test.ts` は 2 本のテストを持つ。1 本目は `configDefaults.exclude` の後ろの一覧と `reporters` を、2 本目は `TEST_VERBOSE` による `reporters` の切り替えと `passWithNoTests` を確かめる。出所: `vitest.config.test.ts:24-53`
- F2: `vitest.config.ts` は、`exclude` に `configDefaults.exclude` と目印の間の一覧を置き、`reporters` を `TEST_VERBOSE` で切り替え、`passWithNoTests: true` を置く。出所: `vitest.config.ts:1-17`
- F3: `scripts/product-ready/index.mjs` は、目印の間を書き換えて `exclude` を作る。`scripts/product-ready/index.test.ts` は、生成する設定に `passWithNoTests: true` が入ることを確かめる。出所: `scripts/product-ready/index.mjs:7-8`、`scripts/product-ready/index.test.ts:94-98`
- F4: `package.json` の `test:run` は `vitest run`、`typecheck` は `node scripts/checks/typecheck.mjs`、`lint` は `oxlint --deny-warnings` である。出所: `package.json:5-20`

### Scope

- In:
  - structure: 1 本目、`markerList()`、未使用になる import、2 本目の `passWithNoTests` の断言を削除する。2 本目で `TEST_VERBOSE` を確かめる部分は残す。
  - expression: 2 本目の表題から `passWithNoTests` を外す。
  - cost: テストが 1 本減り、実行時間がわずかに縮む。
  - failure: 1 本目が確かめていた「exclude が目印の一覧と一致する」検査がなくなる。かわりに `scripts/product-ready/index.test.ts` が、生成する設定の目印と `passWithNoTests` を確かめる（F3）。
  - verification: `pnpm test:run` ですべてのテストが成功し、`pnpm typecheck` と `pnpm lint` が通る。テストは 1 本減る。
- Out:
  - result: 製品の外から見える振る舞いを変えない（テストだけを扱う）。
  - logic: 製品の判断、手順、規則を変えない（`vitest.config.ts` の値も変えない）。
  - upstream: 外部パッケージを足さない、更新しない、削除しない。
  - downstream: `vitest.config.test.ts` を名指しする設定や文書はない（テストは vitest が自動で見つける）。このエントリでは `vitest.config.ts` を変えない。
  - existing: 既存のデータ、インストール済みのバージョン、配布済みの文書を移さない。
  - safety: 秘密、権限、公開、個人データを扱わない。
  - observability: ログ、メトリクス、監査記録を変えない。
  - release: 配布の仕方、適用の仕方、戻し方を変えない。
  - other: 上のどれにも当たらない関心はない。

### Decision

- Status: **accepted**
- Main: `vitest.config.test.ts` から、振る舞いを持たない定数確認がなくなり、残るテストは `TEST_VERBOSE` の切り替えだけを確かめる（C1, C7）
  - Add:
    - なし
  - Update:
    - 2 本目の表題から `passWithNoTests` を外す（C3, C4, F1）
    - 2 本目は `TEST_VERBOSE` の有無による `reporters` の切り替えだけを確かめ、`passWithNoTests` の断言を削除する（C3, C4, F1）
  - Drop:
    - 1 本目（`configDefaults.exclude` の後ろの一覧と `reporters` の値の確認）を削除する（C2, C4, F1）
    - `markerList()` を削除する（C5, F1）
    - 未使用になる import（`readFileSync`、`dirname`、`join`、`fileURLToPath`、`configDefaults`、既定 import の `config`）を削除する（C5, F1）
    - `passWithNoTests` の断言 2 つを削除する（C3, C4, F1）
- Sub: なし
- Policy:
  - Allowed:
    - 1 本目を削除する（C4, F1）
    - `passWithNoTests` の断言を削除する（C3, C4, F1）
    - 2 本目の `TEST_VERBOSE` の確認を残す（C4, F1）
    - `pnpm test:run`、`pnpm typecheck`、`pnpm lint` で確かめる（F4）
  - Forbidden:
    - `vitest.config.ts` の値（`exclude`、`reporters`、`passWithNoTests`）を変えない - テストだけを扱い、028 は振る舞いを変えない（C6, F2）
    - 2 本目の `TEST_VERBOSE` の確認を削除しない - 振る舞いを持つ唯一の確認になる（C4, F1）
    - 新しいテストを足さない - 削除する検査の代わりは `scripts/product-ready/index.test.ts` にある（F3）

#### Details

- 残る `vitest.config.test.ts` の形
  ```ts
  import { describe, expect, it, vi } from 'vitest';

  describe('vitest config', () => {
    it('happy: TEST_VERBOSE の有無で reporters が切り替わる → 一致する', async () => {
      const original = process.env.TEST_VERBOSE;
      try {
        process.env.TEST_VERBOSE = '1';
        vi.resetModules();
        const verboseConfig = (await import('./vitest.config.ts')).default;
        expect(verboseConfig.test?.reporters).toEqual(['verbose']);

        delete process.env.TEST_VERBOSE;
        vi.resetModules();
        const plainConfig = (await import('./vitest.config.ts')).default;
        expect(plainConfig.test?.reporters).toEqual([['default', { summary: false }]]);
      } finally {
        if (original === undefined) {
          delete process.env.TEST_VERBOSE;
        } else {
          process.env.TEST_VERBOSE = original;
        }
        vi.resetModules();
      }
    });
  });
  ```

### Definition

- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取るという主機能は変わらず、定数を確かめるテストが 1 本減り、`TEST_VERBOSE` の切り替えを確かめるテストだけが残る。
- `Unit.product-ready`(kept): ハーネスのテストを外した状態に切り替えるという主機能は変わらず、生成する設定の `passWithNoTests` を product-ready のテストが確かめる。
- `Stack.Checks.Test runner`(kept): vitest のままで、設定の値は変わらない。

## 04: サイクルの対象のテストから、希少な入力と定数の確認を削除できるか

Type: _Simple_

### Context

- C1: このサイクルは `ROADMAP.md` 028（0.9.6、不要テストの整理）を扱い、`memo-test.md` 5.2 の 5 番目「小さな Unit」を実行する。01〜03 に続けて、議論のなかで 04 を加えた。04 は、オーナーの「サイクルの対象のテストで、プリンシプルに照らして減るものはほかにないか」という問いから始まった。
- C2: 削除の候補は 6 つである。① `quality-gate/gate/checks.test.ts` の `assertNoExclusion(128)` は `assertNoExclusion(1)` と同じ `code !== 0` の分岐を確かめる。② 同じファイルの `toRelative(cwd, cwd)` は、製品の実行では渡らない空の相対パスを確かめる。③ `quality-gate/gate/targets.test.ts` の指紋の書式 `^\d+:\d+:\d+$` は実装の値を写しただけの確認である。④ `sound-notify/index.test.ts` の「record でなければ false」は、pi のイベントに現れない `undefined` と `{}` を確かめる。⑤ 同じファイルの commit のテストの 6 桁のハッシュは、7〜40 桁の実際のハッシュには現れない。⑥ `quality-gate/gate/report.test.ts` の「出力が空の失敗」は、空白だけの出力という希少な入力を確かめる。
- C3: 判断の基準は、`AGENTS.md` の Test 1（希少、影響が小さい、すでに存在しないものはテストしない）と Test 2（振る舞いやロジックを持たない primitive、bool、順序、有無はテストしない）、`memo-test.md` 1.2（028 は削除が目的ではない）、1.4-2（実装の値を写すだけの定数確認は削除する）、4.3（同じ振る舞いを 2 つ以上で確かめない）である。
- C4: オーナーは、上の 6 つを削除し、`quality-gate/gate/checks.test.ts` の md の配線テスト（拡張子の絞り込みを配線のレイヤーでも確かめる 2 本）と、`quality-gate/gate/report.test.ts` のメッセージの順序のテストは残すと決めた。Type は Simple である（2026-11-13 の回答）。
- C5: このエントリの問いは、サイクルの対象のテストから、希少な入力と定数の確認を削除できるか。

### Research & Trial

- F1: `checks.ts` の `prepareTargets` は `result.code !== 0` を 1 つの分岐で扱い、1 と 128 を同じ「除外なし」にしている。出所: `.pi/extensions/quality-gate/checks.ts:89-93`
- F2: `toRelative` は `index.ts:117` で変更ファイルのパスにだけ使われ、`cwd` 自身は渡らない。出所: `.pi/extensions/quality-gate/index.ts:117`、`.pi/extensions/quality-gate/checks.ts:58-61`
- F3: 指紋の値は `mtimeNs:ctimeNs:size` で、`changedSince` は前後の値を比較する。出所: `.pi/extensions/quality-gate/targets.ts:69-83,85-99`
- F4: `isCommitResult` は `index.ts:130` で `event.result` にだけ使われる。`resultText` は文字列と `content` を持つ record を扱う。出所: `.pi/extensions/sound-notify/index.ts:103-121,130`
- F5: commit の判定は `/[0-9a-f]{7,40}/` で、7〜40 桁を要求する。出所: `.pi/extensions/sound-notify/index.ts:119-121`
- F6: `clipOutput` は `trim()` した結果が空なら `(no output)` を返す。出所: `.pi/extensions/quality-gate/report.ts:33-50`

### Scope

_omission_

### Decision

- Status: **accepted**
- Main: サイクルの対象のテストから、希少な入力、実装の定数、同じ分岐を繰り返し確かめるだけの断言がなくなり、残るテストは製品の振る舞いを確かめる（C1, C3, C4, C5）
  - Add:
    - なし
  - Update:
    - commit のテストは、7 桁以上のハッシュの断言だけを残し、表題から「6 桁」を外す（C2, F5）
  - Drop:
    - `assertNoExclusion(128)` の呼び出しを削除する（C2, F1）
    - `toRelative(cwd, cwd)` の断言を削除する（C2, F2）
    - 指紋の書式 `^\d+:\d+:\d+$` の断言を削除する（C2, F3）
    - 「record でなければ false（例外を投げない）」のテストを削除する（C2, F4）
    - commit のテストの 6 桁の部分を削除する（C2, F5）
    - 「出力が空の失敗は空である旨の印が出る」のテストを削除する（C2, F6）
- Sub: なし
- Policy:
  - Allowed:
    - 希少な入力と実装の定数だけを確かめる断言を削除する（C2, C3）
    - 製品の振る舞いを確かめるテストは残す（C3, C4）
  - Forbidden:
    - md の配線テストを削除しない - 単体のテストは拡張子の方針を、配線のテストはどのチェックが絞り込みを使うかを確かめており、同じ事実ではない（C4）
    - メッセージの順序のテストを削除しない - メッセージは製品の出力であり、順序は読者のための振る舞いである（C4）
    - 製品コードを変えない - テストだけを扱い、028 は振る舞いを変えない（C3）
    - 振る舞いを確かめるテストを削除しない - 028 は削除が目的ではない（C3）

#### Details

_omission_

### Definition

- `Unit.quality-gate`(kept): そのターンの変更分に対する検査結果を返すという主機能は変わらず、テストから希少な入力と定数の確認だけが減る。
- `Unit.sound-notify`(kept): pi からの通知と commit に気づくという主機能は変わらず、テストから実在しない入力の確認だけが減る。
- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取るという主機能は変わらず、対象のテストが 2 本減る。
- `Stack.Checks.Test runner`(kept): vitest のままで、設定は変わらない。
