# ADR 075

## 01: fake-git の一本化と状態の所有

Type: _Full_

### Context

- C1: いまは2つのテストファイルが、それぞれ独立した偽物の git を持つ。`run/worktree.test.ts` の偽物は16-176行、`tool/worktree.test.ts` にも同じ骨格の偽物がある。どちらも `vi.mock('../../../../lib/git-env.mjs')` と `vi.hoisted` で差し替えられ、状態はモジュールスコープの `let` と `const` に置かれ、`beforeEach` で `resetFake()` から `installFake()` の順に初期化される。
- C2: 変えないもの。`vi.mock` の継ぎ目（`git` を引数で受け取る変更は次のサイクル）、`run/worktree.ts` と利用側4ファイル、`CONSULT_ROOT` の扱い（`vi.stubEnv` は残る）。変えるのはテストだけ。
- C3: 意図。偽物は1箇所にだけ存在し、その状態は偽物のインスタンスが持つ。モジュールスコープの `let` をなくす。
- C4: 到達点。`vi.mock` は残したまま、偽物はファイルごとに入れ物（`vi.hoisted`）へ入れ、`beforeEach` で新しいインスタンスを作り直す。状態はテストごとに分かれ、モジュールスコープの `let`、`resetFake()`、`installFake()` は消える。
- このサイクルはロードマップ 037（0.9.8、プリンシプルに違反しているコードの修正）の1サイクル目で、memo の関心-5（重複）と関心-3（状態の持ち方）にあたる。

### Research & Trial

- F1: 2つの偽物は、同じ9つの分岐（`rev-parse`、`worktree list`、`worktree add`、`worktree prune`、`worktree remove`、`status`、`for-each-ref`、`branch -d` と `-D`、それ以外）を持ち、状態変数の名前と型も揃っている。前者は `run/worktree.test.ts`、後者は `tool/worktree.test.ts` を指す。出所: `.pi/extensions/consult/run/worktree.test.ts:16-176`、`.pi/extensions/consult/tool/worktree.test.ts:10-136`
- F2: 両者の違いは3点。(1) `listOverride: string | null` は前者だけが持つ（前者:32）。(2) `lastAdd` は前者だけが持つ（前者:37）。(3) `worktree add` で、前者は `args[5]` を base として読み、改行を含むブランチ名も失敗にし、失敗時も保存場所を作る（前者:84-91）。後者は base を読まず、改行の検査がなく、失敗時に保存場所を作らない（後者:71-75）。
- F3: 前者だけが補助関数 `addOrphan`（前者:161-168）と `markUnmerged`（前者:171-176）を持つ。`makeDirty` は両方にある（前者:156-158、後者:138-140）。
- F4: `resetFake()` は前者が11項目、後者が9項目を戻す。どちらも `installFake()` で `mockGit.mockImplementation` を付け替える（前者:39-153、後者:31-136）。
- F5: テスト本体が偽物の状態を準備している箇所は、前者が16箇所（`listOverride`、`listStatus`、`addStatus`、`pruneStatus`、`forEachRefStatus`、`removeStatus` への直接代入と、`makeDirty`、`addOrphan`、`markUnmerged` の呼び出し）、後者が3箇所（`makeDirty`、`removeStatus`、`forEachRefStatus`）。出所: `.pi/extensions/consult/run/worktree.test.ts:286-571`、`.pi/extensions/consult/tool/worktree.test.ts:220-240`
- F6: `beforeEach` は両方とも `resetFake()`、`installFake()`、`vi.stubEnv('CONSULT_ROOT', tempDir())` の順に呼ぶ（前者:180-184、後者:180-184）。`afterEach` は前者が `vi.unstubAllEnvs()` と `vi.useRealTimers()`、後者が `vi.unstubAllEnvs()` のみ（前者:186-189、後者:186-188）。
- F7: `vi.hoisted(() => createFakeGit())` のように、静的 import した関数を `vi.hoisted` の中で呼ぶ形は `ReferenceError: Cannot access '__vi_import_0__' before initialization` で失敗する。出所: ワークツリー `075-g1` の `probe-vi-mock/form-a.test.ts` の実行結果
- F8: `vi.mock` のファクトリの中で、静的 import 済みの関数を呼ぶ形（同期）も、`await import()` で読み込む形（非同期）も成立する。出所: 同 `form-c.test.ts`、`form-b.test.ts` の実行結果
- F9: `vi.mock` のファクトリの中で作った偽物のインスタンスは、テスト本体から参照できない。モック済みの `git` を import し、`mockClear()` と `mockImplementation()` で戻す形が最小として動いた。出所: 同 `form-b.test.ts`、`form-c.test.ts` の実行結果
- F10: `vi.hoisted` で入れ物を作り、`vi.mock` のファクトリが `git: (cwd, args) => holder.current!.git(cwd, args)` のように遅延参照する形は成立する。テスト本体から `holder.current` を設定・参照でき、`beforeEach` で作り直すと、状態と呼び出しの記録がテストごとに戻る。出所: 同 `form-d-holder.test.ts`、`form-d-beforeeach.test.ts`
- F11: 入れ物の名前が `holder` でも `mockFake` でも実行結果は同じ。ファイル外の変数への参照を拒否するエラーは起きなかった。出所: 同 `form-d-mockprefix.test.ts`
- F12: `vi.mock` のファクトリが `git: holder.current!.git` のように値を取り出す形は、代入前の実行で落ちるか、前のインスタンスに固定されると見られる。構造からの推測で、実行しての確認はしていない。出所: 同（形Dの注意点）
- F13: `vi.mock` のファクトリが `{ git, fake }` を返し、テストが `import * as env` から `env.fake` を読む形は実行時に動くが、型検査は `TS2339` で失敗し、`as unknown as` のキャストが要る。出所: 同 `form-e.test.ts`

### Scope

- In:
  - failure: 偽物の失敗経路（`listStatus`、`addStatus`、`removeStatus`、`pruneStatus`、`forEachRefStatus`、`listOverride`）を、いまと同じ結果で保つ
  - structure: 偽物を1ファイルに集め、状態をファクトリの内側へ移す。`resetFake` と `installFake` を削除する
  - logic: 初期化を「状態のリセットと実装の差し替え」から「新しいインスタンスの代入」に変える。`vi.mock` のファクトリは入れ物を遅延参照する
  - downstream: 2つのテストファイルの取り込みと初期化を、新しい偽物に合わせる
  - expression: 偽物のファイル名と関数名を決める
  - verification: 2つのテストファイル、全体テスト、lint、typecheck を通すことで確かめる
- Out:
  - safety: 秘密情報や権限に触れない（テストの偽物だけを扱う）
  - upstream: 外部の依存を増やさない（パッケージ、ライブラリ、外部契約は変えない）
  - result: テストが観測する結果の種類を変えない（通るか落ちるかの意味を変えない）
  - existing: 保存データ、導入済みのバージョン、配布済みの文書、過去の記録を動かさない（テストコードの移動は structure で扱う）
  - cost: 実行時間を目標にしない（偽物の生成がテストごとに1回増えるだけで、意味のある差は見込まない）
  - observability: ログ、メトリクス、監査記録を変えない
  - release: 配布や適用の仕方を変えない（テストコードのみで、git で戻せる）
  - other: `README.md:243` の記述は本エントリでは変えない（契約テストのエントリで扱う）

### Decision

- Status: **accepted**
- Main: 偽物の git が1つの部品になり、その状態はテストごとに新しいインスタンスが持つ
  - Add:
    - `test/fake-git.fixture.ts` の `createFakeGit()`（偽物を組み立てて返す）（C3, F1, F10）
    - 状態を準備する補助（`makeDirty`、`addOrphan`、`markUnmerged`）を、偽物のメソッドとして移す（F3）
    - 各テストファイルの入れ物 `mockGit`（`vi.hoisted` で作る）。ファクトリの中で偽物を作る形は成立するが、テスト本体からは状態に触れられないので採らない（F8, F9, F10, F11）
  - Update:
    - 2つのテストファイルの偽物を、`createFakeGit()` の取り込みに置き換える（C1, F1）
    - `beforeEach` を「`resetFake()` と `installFake()`」から「入れ物に新しい偽物を入れる」に変える（C4, F6, F10）
  - Drop:
    - 2つのテストファイルにある重複した偽物（それぞれ約160行）（C1, F1, F2）
    - `resetFake()`、`installFake()`、モジュールスコープの状態（C1, C4, F4）
- Secondary: なし
- Policy:
  - Allowed:
    - 偽物の状態をテスト本体から設定・参照する（既存の準備をそのまま移す）（C1, F5）
    - `vi.hoisted` を入れ物にだけ使う（F10）
  - Forbidden:
    - `vi.mock` のファクトリで `mockGit.current!.git` のように値を先に取り出す - 代入前の実行で落ちるか、前のインスタンスに固定されるため（F12）
    - `as unknown as` のキャストで偽物を取り出す - キャストを限られた場合にしか許さない規則に反するため（C2, F13）
    - `run/worktree.ts` と利用側4ファイルを変える - 次のサイクルのため（C2）
    - 偽物の失敗経路の戻り値を変える - 既存テストの意味を変えないため（C1）
    - 偽物の出力を本物の git に合わせて直す - 本エントリの目的は重複と状態の解消であり、出力を変えると既存テストの意味が変わるため（F7）

#### Details

- 共有する偽物の骨格
  ```ts
  // test/fake-git.fixture.ts
  export function createFakeGit() {
    const state = {
      entries,
      orphans,
      unmerged,
      dirtyPaths,
      listStatus,
      listOverride,
      addStatus,
      removeStatus,
      pruneStatus,
      forEachRefStatus,
      lastAdd,
    };
    return { git, state, makeDirty, addOrphan, markUnmerged };
  }
  ```
- テストファイルの入れ物と初期化
  ```ts
  const mockGit = vi.hoisted(() => ({ current: undefined as FakeGit | undefined }));
  vi.mock('../../../../lib/git-env.mjs', () => ({
    git: (cwd: string, args: readonly string[]) => mockGit.current!.git(cwd, args),
  }));
  import { createFakeGit } from '../../../../test/fake-git.ts';
  beforeEach(() => {
    mockGit.current = createFakeGit();
    vi.stubEnv(ROOT_KEY, tempDir());
  });
  ```
- テスト本体からの設定と参照
  ```ts
  mockGit.current!.state.listStatus = 1;
  mockGit.current!.makeDirty(made.path);
  expect(mockGit.current!.state.lastAdd).toEqual({ branch, path, base });
  ```

### Definition

- `Unit.subagent-consult`(kept): 主な機能は同じで、変わったのはワークツリーを扱うテストの偽物（検査の側）だけである。

## 02: 本物の git による契約テスト

Type: _Simple_

### Context

- C1: いまテストは git を1つも起動していない。本物の git を起動するのは `lib/git-env.mjs:28` の1箇所だけで、テストから直接呼ぶ箇所はない。偽物は `worktree list --porcelain`、`for-each-ref`、`branch -d` と `-D` の出力形式を写している。`README.md:243` は「テストは git を1つも起動しない」と書いている。
- C2: 変えないもの。`vi.mock` の継ぎ目、本番コード。断言は、git が出す形の3点と、`GIT_*` を遮断する1点に絞る。
- C3: 意図。本物の git を走らせる契約テストを1本足し、`worktree list --porcelain` の形、`for-each-ref` の形、未マージのブランチへの `branch -d` が断られ、`-D` が通ることを固定する。あわせて `README.md:243` の「テストは git を1つも起動しない」を正しくする。
- C4: テストの置き場所は Decision で決める（Simple なので Scope は省略する）。

### Research & Trial

- F1: 本物の `git worktree list --porcelain` は、worktree ごとに `worktree <path>`、`HEAD <sha>`、`branch refs/heads/<name>` の3行と空行を出す。実体を消した worktree には `prunable gitdir file points to non-existent location` の1行が付く。出所: ワークツリー `075-g3` で `git worktree add` と `git worktree list --porcelain` を実行した結果（git version 2.56.0）
- F2: 本物の `git for-each-ref --format=%(refname) %(worktreepath) refs/heads/consult/*` は、`refs/heads/consult/<name> <worktree path>` を出す。checkout されていないブランチではパスが空になり、行末に半角空白が1つ残る。出所: 同
- F3: 未マージのブランチへの `git branch -d` は終了符号 1 で `error: the branch '<name>' is not fully merged` を stderr に出す。`git branch -D` は終了符号 0 で `Deleted branch <name> (was <sha>).` を stdout に出す。出所: 同
- 不正なブランチ名（空白や改行）への `git worktree add -b` は終了符号 255 で失敗し、worktree のディレクトリを作らない。出所: 同
- `git worktree remove` は、変更の残る worktree に対して終了符号 128 で `contains modified or untracked files, use --force to delete it` を出し、`--force` を付けると終了符号 0 になる。出所: 同
- `git status --porcelain` は、変更なしなら出力が空、未追跡ファイルがあれば `?? <path>` を出す。`git rev-parse --show-toplevel` は、サブディレクトリから実行するとリポジトリの実体パスを返し、リポジトリでない場所では終了符号 128 で `fatal: not a git repository (or any of the parent directories): .git` を出す。出所: 同
- F7: 偽物の `worktree list --porcelain` は `worktree` と `branch` の2行だけで、`HEAD` 行を出さず、`prunable` も裸の語だけを出す。ソースは `prunable` と `prunable ` の両方を受け付ける（`run/worktree.ts:149`）。不正なブランチ名では、本物は終了符号 255 でディレクトリを作らないが、偽物は終了符号 1 でディレクトリを作る（`run/worktree.test.ts:89-91`）。出所: 同、および `.pi/extensions/consult/run/worktree.test.ts:65-75`、`.pi/extensions/consult/run/worktree.ts:149`
- F8: ソースは `for-each-ref` の出力を `orphanBranchesIn` で読み、行を最初の半角空白で `ref` と `at` に分割し、`at` が空でない行を捨てる（`run/worktree.ts:246-261`）。したがって契約テストは、2列目の有無が判定に効くことを固定できる。出所: `.pi/extensions/consult/run/worktree.ts:246-261`
- F9: フック（lefthook）の中で走ると `process.env` に `GIT_INDEX_FILE` などの `GIT_*` が載り、そのまま渡すと `cwd` のリポジトリではなくフックのリポジトリを見てしまう。`.git/index: index file open failed: Not a directory` になった記録が残っている。`gitEnv()` が `GIT_*` を落とすのはこのため。出所: `lib/git-env.mjs:3-18`、`.pi/extensions/consult/README.md:170`
- F10: `gitEnv()` が `GIT_*` を落とすことを確かめるテストはない。`gitEnv` の参照はテストではモックだけである。出所: `git grep gitEnv` の結果（`.pi/extensions/consult/run/subagent.ts:149` と、2つのテストのモック）

### Scope

_omission_

### Decision

- Status: **accepted**
- Main: `.pi/extensions/consult/run/git-contract.test.ts` が加わり、本物の git が出す形が3点で固定され、`GIT_*` の遮断が1点で固定される。README の「テストは git を1つも起動しない」という部分は、契約テストを例外として正しくなる
  - Add:
    - `git-contract.test.ts`（一時リポジトリを作り、本物の git を走らせる）（C3, C4）
      - `worktree list --porcelain` が `worktree`、`HEAD`、`branch` の3行と空行を出し、実体を消した worktree には `prunable` で始まる行が付く（F1）
      - `for-each-ref --format=%(refname) %(worktreepath) refs/heads/consult/*` が2列を出し、`orphanBranchesIn` が checkout 中のブランチを捨てる（F2, F8）
      - 未マージのブランチへの `branch -d` が終了符号 1、`-D` が 0（F3）
      - `GIT_INDEX_FILE` を設定した状態でも、`git()` が一時リポジトリを見る（F9, F10）
  - Update:
    - `README.md:243` の「テストは git を1つも起動しない」を、契約テストだけは本物の git を起動すると直す（C1, C3）
  - Drop:
    - なし
- Secondary: なし
- Policy:
  - Allowed:
    - 契約テストが、`test/temp-dir.ts` の `tempDir()` で作ったディレクトリの中に `git init` して、本物の git を起動する（F1, F2, F3）
    - 契約テストが `lib/git-env.mjs` の `git()` を通して git を起動する（F9）
  - Forbidden:
    - 偽物を本物の出力に合わせて直す - 出力を変えると既存テストの意味が変わるため。エントリ 01 で決めたとおり（F7）
    - 本番コードを変える - このエントリは検証を足すだけのため（C2）
    - 3点以外の出力を固定する - 関係のない git の変更で落ちないようにするため（C2）
    - `spawnSync('git', ...)` を直接呼ぶ - `GIT_*` が子プロセスに渡る経路を作らないため（F9, F10）
    - プロジェクトのリポジトリで git を起動する - 本物のリポジトリを触らないため（C2）

#### Details

_omission_

### Definition

- `Unit.subagent-consult`(kept): 主な機能は同じで、変わったのは git の出力を固定する検査が1つ増えたことだけである。
