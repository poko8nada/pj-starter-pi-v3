# PLAN `quality-gate-sound`

- No: 01, 02, 04
- Place: worktree
- Boundary Plans: なし

## Goal

quality-gate のファイルが `gate/` に集まり、quality-gate と sound-notify のテストが前提を fixture から受け取り、説明と希少な確認が整理される

## Design

- Inside:
  - Modules: `checks`、`report`、`targets` の 3 つは分割したまま `gate/` に移す。`checks` が `report` と `targets` を `needs` し、`index` が 3 つを `needs` する形は変えない。テストの前提は、`checksSetup()` を `gate/checks.fixture.ts` に、`recordingPi()` を `sound-notify/index.fixture.ts` に置く。どちらも 1 つの Unit だけが使う前提であり、`test/` に置く共有のものではない。`gate/checks.fixture.ts` は `quality-gate/` のルートではなく `gate/` に置く。ADR 01 がその場所を決めており、fixture は使うテストと同じ関心のディレクトリに置く（design.md の feature root は Unit のルートを指すが、この Unit の関心の単位は `gate/` である）。
  - Dirs: `quality-gate/` のフラットな 6 ファイルを `quality-gate/gate/` に移す。`gate/` はゲートの処理という関心のディレクトリであり、実装とテストを同じ場所に置く。入口の `index.ts` は Unit のルートに残す。
- Outside:
  - Extract: なし。`test/temp-dir.ts` は OS の一時領域を扱う共有の fixture であり、この plan は形を変えずに読む。
  - Colocate: なし。`recordingPi()` は sound-notify の Unit の中で閉じ、`checksSetup()` は `gate/` の中で閉じる。

## Files

```text
.pi/
  extensions/
    quality-gate/
      gate/                         add
        checks.fixture.ts           add
        checks.test.ts              add
        checks.ts                   add
        report.test.ts              add
        report.ts                   add
        targets.test.ts             add
        targets.ts                  add
      checks.test.ts                drop
      checks.ts                     drop
      index.ts                      update
      README.md                     update
      report.test.ts                drop
      report.ts                     drop
      targets.test.ts               drop
      targets.ts                    drop
    sound-notify/
      index.fixture.ts              add
      index.test.ts                 update
      index.ts
test/
  temp-dir.ts
```

## Slices

## 1.quality-gate の置き場所と前提

quality-gate の 3 つの実装とテストを `gate/` に集め、`checksSetup()` を 1 つの前提にする。

### Types

```ts
interface ExecCall {
  readonly command: string;
  readonly args: readonly string[];
}

interface ScriptResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

interface FakePi {
  readonly pi: ExecPort;
  readonly calls: readonly ExecCall[];
  setCheckIgnoreCode: (code: number) => void;
  setIgnoredStdout: (stdout: string) => void;
  setScriptResult: (script: string, result: ScriptResult) => void;
  setAllPnpm: (result: ScriptResult) => void;
}

export interface ChecksSetup {
  readonly dir: string;
  readonly tsFile: (name: string) => string;
  readonly fake: FakePi;
}
```

### Steps

1. `.pi/extensions/quality-gate/index.ts`
   1. update: `./checks.ts`、`./report.ts`、`./targets.ts` の import を `./gate/checks.ts`、`./gate/report.ts`、`./gate/targets.ts` に直す。
2. `.pi/extensions/quality-gate/gate/checks.ts`
   1. add: `quality-gate/checks.ts` を移す。`./report.ts` と `./targets.ts` の import は同じフォルダになるため変えない。
3. `.pi/extensions/quality-gate/gate/report.ts`
   1. add: `quality-gate/report.ts` をそのまま移す。
4. `.pi/extensions/quality-gate/gate/targets.ts`
   1. add: `quality-gate/targets.ts` をそのまま移す。
5. `.pi/extensions/quality-gate/gate/report.test.ts`
   1. add: `quality-gate/report.test.ts` をそのまま移す。
6. `.pi/extensions/quality-gate/gate/checks.fixture.ts`
   1. add: `ExecCall`、`ScriptResult`、`FakePi`、`fakePi()`、`tsFile(dir, name)` を `checks.test.ts` から移す。`checks.test.ts` からは削除し、`FakePi` は export せず、このファイルの中だけで使う。
   2. add: `checksSetup()` を置く。`tempDir()` と `fakePi()` を呼び、`tsFile(dir, name)` を `tsFile(name)` に束ねる。

      ```ts
      import { writeFileSync } from 'node:fs';
      import { join } from 'node:path';
      import { tempDir } from '../../../../test/temp-dir.ts';
      import type { ExecPort } from './checks.ts';

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

   3. add: 冒頭に、次のコメントを置く。

      ```ts
      /**
       * 品質ゲートのテストの前提を組み立てる fixture である。
       *
       * `checksSetup()` は、一時ディレクトリ、その中のファイルを作る関数、偽の `pi` を返す。
       * `fakePi()` と `tsFile()` は、このファイルの中だけで使う。
       * この fixture はテストの中だけで使う。テストの外で `checksSetup()` を呼ぶと、`tempDir()` がディレクトリを作り、`vitest` の `afterEach` が無いため残る。止まらない。
       */
      ```
7. `.pi/extensions/quality-gate/gate/checks.test.ts`
   1. add: `quality-gate/checks.test.ts` を移す。
   2. update: `tempDir` と `ExecPort` の import を削除し、`checksSetup` を `./checks.fixture.ts` から import する。
   3. update: 9 か所を `const setup = checksSetup();` で始め、`setup.dir`、`setup.tsFile(...)`、`setup.fake` を使う。9 か所は `assertNoExclusion` と、次の 8 つの `it` である。`削除済みのファイルはチェックに含めず skipped に入れる`、`すべて削除済みなら git を実行せず skipped にすべて入る`、`.gitignore の対象だけを skipped に入れ、check-ignore が 0 以外でも出力があれば除外しない`、`typecheck は拡張子で絞らず md も渡す`、`format は md を渡し lint は md を渡さない`、`対象拡張子がない場合はそのチェックを実行せず 1 件だけ残る`、`pnpm が失敗すれば failed になり stdout と stderr を改行でつなぐ`、`fix フェーズだけが失敗しても verify フェーズの結果はすべて成功する`。`const dir = tempDir();` は `const setup = checksSetup();` に、`tsFile(dir, 'x')` は `setup.tsFile('x')` に、`fakePi()` は `setup.fake` に、`join(dir, 'x')` は `join(setup.dir, 'x')` に、`runChecks(fake.pi, { cwd: dir }, ...)` は `runChecks(setup.fake.pi, { cwd: setup.dir }, ...)` に直す。
   4. update: `assertNoExclusion(code)` は内部で `checksSetup()` を呼び、`setup.fake` と `setup.dir` を使う。コードは次の形にする。

      ```ts
      async function assertNoExclusion(code: number): Promise<void> {
        const setup = checksSetup();
        const file = setup.tsFile('a.ts');
        setup.fake.setCheckIgnoreCode(code);
        const ignored = `${file}\n`;
        setup.fake.setIgnoredStdout(ignored);

        const run = await runChecks(setup.fake.pi, { cwd: setup.dir }, [file]);

        expect(run.skipped).toEqual([]);
        const gitCall = setup.fake.calls.find((call) => call.command === 'git');
        expect(gitCall?.args).toEqual(['check-ignore', '--', file]);
        const pnpmArgs = setup.fake.calls
          .filter((call) => call.command === 'pnpm')
          .map((call) => call.args);
        expect(pnpmArgs.length).toBeGreaterThan(0);
        for (const args of pnpmArgs) {
          expect(args).toContain(file);
        }
      }
      ```

   5. update: 冒頭コメントに、前提は `checks.fixture.ts` の `checksSetup()` が組み立てる、と 1 文加える。
8. `.pi/extensions/quality-gate/gate/targets.test.ts`
   1. add: `quality-gate/targets.test.ts` を移す。
   2. update: `temp-dir.ts` の import を `../../../../test/temp-dir.ts` に直す。
9. `.pi/extensions/quality-gate/checks.ts`
   1. drop: `gate/checks.ts` へ移したため、ルートのパスをなくす。
10. `.pi/extensions/quality-gate/checks.test.ts`
    1. drop: `gate/checks.test.ts` へ移したため、ルートのパスをなくす。
11. `.pi/extensions/quality-gate/report.ts`
    1. drop: `gate/report.ts` へ移したため、ルートのパスをなくす。
12. `.pi/extensions/quality-gate/report.test.ts`
    1. drop: `gate/report.test.ts` へ移したため、ルートのパスをなくす。
13. `.pi/extensions/quality-gate/targets.ts`
    1. drop: `gate/targets.ts` へ移したため、ルートのパスをなくす。
14. `.pi/extensions/quality-gate/targets.test.ts`
    1. drop: `gate/targets.test.ts` へ移したため、ルートのパスをなくす。
15. `README.md`
    1. update: `Tests` セクションの `targets.test.ts` を `gate/targets.test.ts` に直す。

### Policy

- Allowed:
  - 1 つの Unit だけで使う fixture を、その Unit の `*.fixture.ts` に置く。
  - 前提を組み立てる関数を、呼ぶたびに新しい値を返す形にする。
  - `quality-gate` の 3 つの実装とテストを `gate/` に集め、入口の `index.ts` をルートに残す。
- Forbidden:
  - テストの間で値を持ち越さない - 持ち越すとテストが順序に依存するため。
  - テストの断言と製品コードを変えない - 028 は振る舞いを変えない。
  - 複数 Unit で使わない fixture を `test/` に置かない - メモ 1.4-3 の置き場所に反する。
  - `quality-gate/index.ts` を `gate/` に動かさない - pi がこのパスを入口として読み込む。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/quality-gate/index.ts .pi/extensions/quality-gate/gate/checks.test.ts .pi/extensions/quality-gate/gate/report.test.ts .pi/extensions/quality-gate/gate/targets.test.ts`
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 2.sound-notify の前提

sound-notify のテストの前提を `recordingPi()` と 1 組の `played`/`setPlayer` に寄せる。

### Types

```ts
import type { EntryPiPort } from './index.ts';

export interface RecordingPi {
  readonly pi: EntryPiPort;
  readonly handlers: ReadonlyMap<string, (...args: unknown[]) => unknown>;
  readonly calls: readonly { readonly command: string; readonly args: readonly string[] }[];
}
```

### Steps

1. `.pi/extensions/sound-notify/index.fixture.ts`
   1. add: `RecordingPi`、`isHandler`、`recordingPi()` を置く。`index.test.ts` の `recordingPi` の組み立てを移す。`index.test.ts` から `isHandler` も削除する。

      ```ts
      import type { EntryPiPort } from './index.ts';

      export interface RecordingPi {
        readonly pi: EntryPiPort;
        readonly handlers: ReadonlyMap<string, (...args: unknown[]) => unknown>;
        readonly calls: readonly { readonly command: string; readonly args: readonly string[] }[];
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

   2. add: 冒頭に、次のコメントを置く。

      ```ts
      /**
       * sound-notify のテストの前提を組み立てる fixture である。
       *
       * `recordingPi()` は、`handlers` と `calls` を記録する偽の `pi` を返す。
       * この fixture はテストの中だけで使う。テストの外でも止まらない。
       */
      ```
2. `.pi/extensions/sound-notify/index.test.ts`
   1. update: `./index.ts` の import から `type EntryPiPort` を外し、`{ recordingPi, type RecordingPi }` を `./index.fixture.ts` から import する。
   2. update: `createEntry` と `entryWithFile` を `recordingPi()` を使う形にし、戻り値を `RecordingPi`（`entryWithFile` は `& { dir: string }`）にする。

      ```ts
      function createEntry(config: Settings = defaults): RecordingPi {
        const recording = recordingPi();
        registerSoundHandlers(recording.pi, config);
        return recording;
      }

      function entryWithFile(document: unknown): RecordingPi & { dir: string } {
        const dir = tempDir();
        writeFileSync(
          join(dir, 'settings.json'),
          typeof document === 'string' ? document : JSON.stringify(document),
        );
        const recording = recordingPi();
        entry(recording.pi, dir);
        return { ...recording, dir };
      }
      ```

   3. update: 7 つの `describe`（`sound-notify.settings`、`sound-notify.default-export`、`sound-notify.commit`、`sound-notify.compact`、`sound-notify.guard`、`sound-notify.prompt`、`sound-notify.entry`）の `played`、`beforeEach`、`afterEach` を削除し、`entryWithFile` の後、最初の `describe` の前に 1 組だけ置く。`isCommitResult` の `describe` は `played` を使わないが、この 1 組の `beforeEach`/`afterEach` はそこで実行される。player を差し替えて戻すだけで、音は鳴らない。

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

   4. update: 冒頭コメントに、偽の `pi` は `index.fixture.ts` の `recordingPi()` が組み立てる、と 1 文加える。

### Policy

- Allowed:
  - 1 つの Unit だけで使う fixture を、その Unit の `*.fixture.ts` に置く。
  - 前提を組み立てる関数を、呼ぶたびに新しい値を返す形にする。
  - `played` と `setPlayer` を、ファイル先頭の 1 組の `beforeEach`/`afterEach` にまとめる。
- Forbidden:
  - テストの間で値を持ち越さない - 持ち越すとテストが順序に依存するため。
  - テストの断言と製品コードを変えない - 028 は振る舞いを変えない。
  - 複数 Unit で使わない fixture を `test/` に置かない - メモ 1.4-3 の置き場所に反する。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/sound-notify/index.test.ts`
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 3.希少な入力と定数の確認の削除

テストから、希少な入力と実装の定数だけを確かめる断言を削除する。`toRelative(cwd, cwd)` の空の相対パスは、ADR 04 が希少な入力として削除を決めた。happy の相対パスだけを残す。

### Types

なし

### Steps

1. `.pi/extensions/quality-gate/gate/checks.test.ts`
   1. update: `assertNoExclusion(128)` の呼び出しを削除し、`assertNoExclusion(1)` だけ残す。
   2. update: `toRelative(cwd, cwd)` の断言を削除し、相対パスの断言だけ残す。
2. `.pi/extensions/quality-gate/gate/targets.test.ts`
   1. update: 指紋の書式 `^\d+:\d+:\d+$` の断言を削除し、存在するファイルだけが指紋を持つことの断言を残す。
3. `.pi/extensions/quality-gate/gate/report.test.ts`
   1. update: 「出力が空の失敗は空である旨の印が出る」のテストを削除する。
4. `.pi/extensions/sound-notify/index.test.ts`
   1. update: `isCommitResult` の「record でなければ false（例外を投げない）」のテストを削除する。
   2. update: commit のテストから 6 桁の部分を削除し、表題を「bash の結果にコミットの形があれば commit の音が 1 回鳴る」にする。

### Policy

- Allowed:
  - 希少な入力と実装の定数だけを確かめる断言を削除する。
  - 製品の振る舞いを確かめるテストは残す。
- Forbidden:
  - md の配線テストを削除しない - 単体のテストは拡張子の方針を、配線のテストはどのチェックが絞り込みを使うかを確かめており、同じ事実ではない。
  - メッセージの順序のテストを削除しない - メッセージは製品の出力であり、順序は読者のための振る舞いである。
  - 製品コードを変えない - テストだけを扱い、028 は振る舞いを変えない。
  - 振る舞いを確かめるテストを削除しない - 028 は削除が目的ではない。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/quality-gate/gate/checks.test.ts .pi/extensions/quality-gate/gate/targets.test.ts .pi/extensions/quality-gate/gate/report.test.ts .pi/extensions/sound-notify/index.test.ts`
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 4.テストの説明

`targets.test.ts` の冒頭の説明を、実際に試している範囲に合わせる。

### Types

なし

### Steps

1. `.pi/extensions/quality-gate/gate/targets.test.ts`
   1. update: 冒頭の説明を「porcelain の解析、差分、指紋、拡張子の絞り込みを試す。`git` の起動は試さない。」に直す。

### Policy

- Allowed:
  - 説明に、試している関数の名前を書く。
  - ADR 02 の `Update` の文面の分類（porcelain、差分、指紋、拡張子の絞り込み）は、`parseStatus`、`changedSince`、`fingerprint`、`filterByExtensions` を指す。
  - 表題とテストの断言は変えない。
- Forbidden:
  - テストの断言を変えない - 028 は振る舞いを変えない。
  - `git` を起動するテストを足さない - 実リポジトリが要るため、このエントリの範囲外である。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/quality-gate/gate/targets.test.ts`
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: other — `gate/targets.test.ts:7` の説明を読み、`parseStatus`、`changedSince`、`fingerprint`、`filterByExtensions` と一致することを確かめる。

## Notes

### Slice 1: quality-gate の置き場所と前提

- Findings: なし
- Unplanned: なし
- Commit: b409eee6ec559e82ab2a6f41224c56b79b9a4c50
- Stopped:

### Slice 2: sound-notify の前提

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 3: 希少な入力と定数の確認の削除

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 4: テストの説明

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal:
- Ran:
- Findings:
- Doubts:
