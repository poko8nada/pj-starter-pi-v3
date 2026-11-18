# PLAN `fake-git`

- No: 01
- Place: worktree
- Boundary Plans: なし

## Goal

2つのテストが持つ偽物の git が、`test/fake-git.fixture.ts` の1つになり、状態はテストごとに分かれる。

## Refactor

- Inside:
  - Modules: 2つのテストファイルが持つ偽物を、`test/fake-git.fixture.ts` という1つのファイルに統合する。理由は、2つの偽物が同じ9つの分岐と同じ名前の状態を持ち（F1）、違いが3点だけ（F2）なので、1つにすると同じ定義を2つ持たなくて済む。`resetFake()` と `installFake()` も消える。
  - Dirs: なし。`test/` はそのままで、ファイルを1つ増やす。
- Outside:
  - Extract: `test/fake-git.fixture.ts` を作る。理由は、偽物が写しているのは git の形であり、consult の機能が持つ形ではないため（design.md: 機能が持たない形のフィクスチャは `test/` に置く）。名前は `*.fixture.ts` にする（design.md）。
  - Colocate: なし。共有をやめるモジュールはない。

## Files

```text
test/
  fake-git.fixture.ts        add
scripts/
  harness-sync/
    setting.json             update
.pi/
  extensions/
    consult/
      run/
        worktree.test.ts     update
      tool/
        worktree.test.ts     update
        worktree.ts          update
```

## Slices

## 1.共有する偽物が1つのファイルとして存在する

git の偽物が、2つのテストが使える1つのファイルになる。

### Types

```ts
/** 偽物が返す git の結果。本物の `git()` と同じ形（`error?` を含む） */
export interface GitResult {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: string;
}

/**
 * 偽物の状態。テストが直接設定するので、フィールドは readonly にしない。
 * ADR 01 の Allowed（偽物の状態をテスト本体から設定・参照する）を満たすため。
 * 判別可能な union にしないのは、`listStatus` などの値が同時に成立するため（対義的な状態の集合ではない）。
 */
export interface FakeState {
  entries: { path: string; ref: string }[];
  orphans: Map<string, boolean>;
  unmerged: Set<string>;
  dirtyPaths: Set<string>;
  listStatus: number;
  listOverride: string | null;
  addStatus: number;
  removeStatus: number;
  pruneStatus: number;
  forEachRefStatus: number;
  lastAdd: { branch: string; path: string; base: string } | null;
}

/** 偽物の見せ方。状態と、状態を準備する3つの補助を持つ */
export interface FakeGit {
  readonly git: (cwd: string, args: readonly string[]) => GitResult;
  readonly state: FakeState;
  readonly makeDirty: (path: string) => void;
  readonly addOrphan: (branch: string, merged: boolean) => void;
  readonly markUnmerged: (branch: string) => void;
}

declare function createFakeGit(): FakeGit;
```

### Steps

1. `test/fake-git.fixture.ts`
   1. add: `createFakeGit()` の骨格。`state` を持ち、`git`、`makeDirty`、`addOrphan`、`markUnmerged` をこの関数の内側の関数宣言として置き、`{ git, state, makeDirty, addOrphan, markUnmerged }` を返す。関数を内側に置くのは、4つとも `state` をクロージャで使うため。

      ```ts
      export function createFakeGit(): FakeGit {
        const state: FakeState = {
          entries: [],
          orphans: new Map(),
          unmerged: new Set(),
          dirtyPaths: new Set(),
          listStatus: 0,
          listOverride: null,
          addStatus: 0,
          removeStatus: 0,
          pruneStatus: 0,
          forEachRefStatus: 0,
          lastAdd: null,
        };
        function git(cwd: string, args: readonly string[]): GitResult {
          // 9つの分岐は手順1.2 で移す
          return { status: 0, stdout: '', stderr: '' };
        }
        function makeDirty(path: string): void {
          state.dirtyPaths.add(path);
        }
        function addOrphan(branch: string, merged: boolean): void {
          state.orphans.set(branch, merged);
          if (merged) state.unmerged.delete(branch);
          else state.unmerged.add(branch);
        }
        function markUnmerged(branch: string): void {
          state.unmerged.add(branch);
          if (state.orphans.has(branch)) state.orphans.set(branch, false);
        }
        return { git, state, makeDirty, addOrphan, markUnmerged };
      }
      ```

   2. add: `git(cwd, args)` の本体。`run/worktree.test.ts` の `installFake()` の実装を写し、モジュール変数（`entries`、`orphans`、`unmerged`、`dirtyPaths`、`listStatus`、`listOverride`、`addStatus`、`removeStatus`、`pruneStatus`、`forEachRefStatus`、`lastAdd`）の参照をすべて `state.<名前>` に置き換える。`vi.fn` は使わず、普通の関数にする。`node:fs` の `existsSync` と `mkdirSync` をこのファイルで import する。`worktree add` の失敗時は、`installFake()` と同じく `mkdirSync(path)` してから status 1 を返す。
   3. add: `makeDirty(path)`。`state.dirtyPaths` に足す。
   4. add: `addOrphan(branch, merged)`。`state.orphans` と `state.unmerged` を同時に整合させる（`run/worktree.test.ts` の定義をそのまま移す）。
   5. add: `markUnmerged(branch)`。`state.unmerged` に足し、`state.orphans` にあれば値を `false` にする。

2. `scripts/harness-sync/setting.json`
   1. update: `copy` に `test/fake-git.fixture.ts` を足す（`test/` のファイルは個別に並べる規則があるため）。
   2. update: `push` に同じ行を足す（既存の `test/*.ts` が両方に並んでいるため）。

### Policy

- Allowed:
  - 偽物の状態をテスト本体から直接設定・参照する - 既存の準備をそのまま移すため。
  - `vi.hoisted` を入れ物にだけ使う - 遅延参照で状態に届く形にするため。
- Forbidden:
  - `vi.mock` のファクトリで `mockGit.current!.git` のように値を先に取り出す - 代入前の実行で落ちるか前のインスタンスに固定されるため。
  - `as unknown as` のキャストで偽物を取り出す - キャストを限られた場合にしか許さない規則に反するため。
  - `run/worktree.ts` と利用側4ファイルを変える - 次のサイクルのため。
  - 偽物の失敗経路の戻り値を変える - 既存テストの意味を変えないため。
  - 偽物の出力を本物の git に合わせて直す - 本エントリの目的は重複と状態であり、出力を変えると既存テストの意味が変わるため。

### Verify

- Always:
  - `pnpm test:run`（このスライスの時点では偽物をまだ取り込まないため、関連テストは無い）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、それが指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 2.2つのテストファイルが共有の偽物を使う

2つのテストが、自分の偽物ではなく、共有の偽物を使う。

### Types

なし

### Steps

1. `.pi/extensions/consult/run/worktree.test.ts`
   1. drop: 偽物の定義。`vi.hoisted` の `mockGit`、`vi.mock` のブロック全体、`Entry` 型、状態の変数11個（`entries`、`orphans`、`unmerged`、`dirtyPaths`、`listStatus`、`listOverride`、`addStatus`、`removeStatus`、`pruneStatus`、`forEachRefStatus`、`lastAdd`）、`resetFake()`、`installFake()`、`makeDirty()`、`addOrphan()`、`markUnmerged()`。
   2. add: `createFakeGit` の取り込みと、入れ物と、遅延参照する `vi.mock`。

      ```ts
      const mockGit = vi.hoisted(() => ({ current: undefined as FakeGit | undefined }));
      vi.mock('../../../../lib/git-env.mjs', () => ({
        git: (cwd: string, args: readonly string[]) => mockGit.current!.git(cwd, args),
        gitEnv: (env?: NodeJS.ProcessEnv) => ({ ...env }),
      }));
      import { createFakeGit, type FakeGit } from '../../../../test/fake-git.fixture.ts';
      ```

   3. update: `beforeEach` を、`resetFake()` と `installFake()` から、入れ物に新しい偽物を入れる形に変える。

      ```ts
      beforeEach(() => {
        mockGit.current = createFakeGit();
        vi.stubEnv(ROOT_KEY, tempDir());
      });
      ```

   4. update: 状態への直接代入6箇所を、`mockGit.current!.state.<名前> = ...` に変える（`addStatus`、`listOverride`、`listStatus`、`removeStatus`、`pruneStatus`、`forEachRefStatus` が1箇所ずつ）。
   5. update: 補助の呼び出し10箇所を、`mockGit.current!.makeDirty(...)`、`mockGit.current!.addOrphan(...)`、`mockGit.current!.markUnmerged(...)` に変える（`makeDirty` 4、`addOrphan` 2、`markUnmerged` 4）。
   6. update: `lastAdd` の参照2箇所を `mockGit.current!.state.lastAdd` に変える。
   7. update: 使わなくなった import を外す（`existsSync`、`mkdirSync` など。型検査と lint の指摘に従い、残るテストが使うものは残す）。
2. `.pi/extensions/consult/tool/worktree.test.ts`
   1. drop: 偽物の定義。`vi.hoisted` の `mockGit`、`vi.mock` のブロック全体、`Entry` 型、状態の変数11個、`resetFake()`、`installFake()`、`makeDirty()`。
   2. add: `createFakeGit` の取り込みと、入れ物と、遅延参照する `vi.mock`。run 側と同じ形。取り込みのパスも run 側と同じ `../../../../test/fake-git.fixture.ts` である（両ファイルは同じ深さにある）。

      ```ts
      const mockGit = vi.hoisted(() => ({ current: undefined as FakeGit | undefined }));
      vi.mock('../../../../lib/git-env.mjs', () => ({
        git: (cwd: string, args: readonly string[]) => mockGit.current!.git(cwd, args),
        gitEnv: (env?: NodeJS.ProcessEnv) => ({ ...env }),
      }));
      import { createFakeGit, type FakeGit } from '../../../../test/fake-git.fixture.ts';
      ```

   3. update: `beforeEach` を、入れ物に新しい偽物を入れる形に変える。run 側と同じ形。

      ```ts
      beforeEach(() => {
        mockGit.current = createFakeGit();
        vi.stubEnv(ROOT_KEY, tempDir());
      });
      ```

   4. update: 状態を準備する3箇所（`makeDirty`、`removeStatus`、`forEachRefStatus`）を、`mockGit.current!.makeDirty(...)` と `mockGit.current!.state.<名前> = ...` に変える。
   5. update: 使わなくなった import を外す（型検査と lint の指摘に従う）。
   6. update: `removeText` のコメント1行と表示メッセージ2行（`消した<旧語>`、`残した<旧語>（未マージ）`）の旧語を `ブランチ` に揃える。旧語は ja-check の禁止語であり、テストの期待文字列と一致させるためで、振る舞いは変えない。

### Policy

- Allowed:
  - 偽物の状態をテスト本体から直接設定・参照する - 既存の準備をそのまま移すため。
  - 和集合の偽物をそのまま使う - 2つのテストの違いは3点だけで、後者は `addStatus` を設定しないため。
- Forbidden:
  - `vi.mock` のファクトリで `mockGit.current!.git` のように値を先に取り出す - 代入前の実行で落ちるか前のインスタンスに固定されるため。
  - `as unknown as` のキャストで偽物を取り出す - キャストを限られた場合にしか許さない規則に反するため。入れ物の `undefined as FakeGit | undefined` は、`undefined` がその型の値なので、この禁止に当たらない。
  - `run/worktree.ts` を変える - 次のサイクルのため。
  - 利用側4ファイルのうち、表示の語（`枝` を `ブランチ`）以外を変える - このスライスは偽物の置き場所を変えるだけで、表示の語は ja-check の禁止語に合わせるためだけに変える。
  - テストの意味を変える - このスライスは偽物の置き場所だけを変えるため。
  - 偽物の出力を本物の git に合わせて直す - 本エントリの目的は重複と状態であり、出力を変えると既存テストの意味が変わるため。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/run/worktree.test.ts .pi/extensions/consult/tool/worktree.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、それが指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: other — 2つのテストファイルが、`run/worktree.test.ts` は33、`tool/worktree.test.ts` は21のテストで通る。和集合にしたことで後者の結果が変わらないことを確かめる。

## Notes

### Slice 1: 共有する偽物が1つのファイルとして存在する

- Findings: なし
- Unplanned: `test/fake-git.fixture.ts` の `createFakeGit` と `git` に `eslint-disable-next-line max-lines-per-function` を付けた。`*.fixture.ts` はテスト用の上乗せ（240行）を受けず上限80のため、plan の内側4関数と9分岐の形では超える。理由を添えて抑え、戻り値と分岐は変えていない。
- Commit: 433440e7
- Stopped:

### Slice 2: 2つのテストファイルが共有の偽物を使う

- Findings: なし
- Unplanned: 2件。1) 両テスト先頭に `/* eslint-disable typescript/no-non-null-assertion` を付けた。plan が `mockGit.current!` の遅延参照を決めているが、lint が `!` を禁じるため。形は変えず理由付きで抑えた。2) `枝`→`ブランチ` に8か所（run 4件のテスト名、tool 2件のテスト名＋2件の期待文字列）を置換。`scripts/checks/ja-check.json` の追加語でフックが落ちるため。期待2件は実装の出力と連動するので `tool/worktree.ts` の出力2件＋注釈1件も同語に揃え、テストの意味は変えていない。この本番の変更は、走行中に ADR 01 の C2 と計画の Policy を改めて許した（オーナーの承認）。
- Commit: 5caf525a
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
