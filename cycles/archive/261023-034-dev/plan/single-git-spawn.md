# PLAN `single-git-spawn`

## Files

```text
lib/
  git-env.mjs                          update
.pi/
  extensions/
    consult/
      README.md                        update
      index.test.ts                    update
      policy/
        types.test.ts                  update
      run/
        git-env.ts                     drop
        run.ts                         update
        worktree.ts                    update
        worktree.test.ts               update
        delivery.test.ts               update
        log.test.ts                    update
        place.test.ts                  update
      sub/
        guard.test.ts                  update
      tool/
        consult.test.ts                update
        subagents.test.ts              update
        worktree.test.ts               update
    context-prune/
      index.test.ts                    update
      command/
        prune.test.ts                  update
      prune/
        ports.test.ts                  update
      settings/
        read.test.ts                   update
    quality-gate/
      checks.test.ts                   update
      targets.test.ts                  update
    thinking-scrub/
      index.test.ts                    update
      settings/
        read.test.ts                   update
  skills/
    adr/
      scripts/
        scaffold.mjs                   update
        scaffold.test.ts               update
scripts/
  checks/
    typecheck.test.ts                  update
    typecheck-staged.test.ts           update
  harness/
    config.test.ts                     update
    harness.json                       update
    index.test.ts                      update
    list.test.ts                       update
  product-ready/
    index.test.ts                      update
    targets.test.ts                    update
test/
  README.md                            drop
  env.test.ts                          drop
  setup.ts                             drop
  temp-dir.ts                          add
  tmp.ts                               drop
vitest.config.ts                       update
```

## 1.起動口を 1 つにする

### Types

```ts
// lib/git-env.mjs（JSDoc。tsconfig は checkJs を持たないので、値は下の check が持つ）
export function git(
  cwd: string,
  args: readonly string[],
): {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: string;
};
```

### Steps

1. `lib/git-env.mjs`:
   - `git(cwd, args)` を足す。`spawnSync('git', [...args], { cwd, encoding: 'utf8', env: gitEnv() })` を打ち、`status` は `?? 1`、`stdout` と `stderr` は `?? ''`、`error` は message にする。
     - Outside: `git` コマンド。`GIT_*` を落とした環境で起動する。
2. `.pi/extensions/consult/run/worktree.ts`:
   - 内部の `git()` を消し、`lib/git-env.mjs` の `git` を呼ぶ。
3. `.pi/extensions/consult/run/run.ts`:
   - `worktreeGit(path)` を、`lib` の `git` を呼んで `{ status, stdout, stderr }` を返す形にする（`error` は落とす）。
4. `.pi/skills/adr/scripts/scaffold.mjs`:
   - `spawnSync('git', ['branch', '--show-current'], ...)` を、`lib` の `git(root, ['branch', '--show-current'])` に置き換える。

### Verify:

- cli: `grep -rn "spawnSync('git'\|spawn('git'\|execFile('git'\|execSync('git'" lib .pi/extensions/consult/run/worktree.ts .pi/extensions/consult/run/run.ts .pi/skills/adr/scripts/scaffold.mjs`
  - (happy) 実行 → `lib/git-env.mjs` の 1 行だけ。3 ファイルは 0 行
- cli: `GIT_DIR=/nonexistent node --input-type=module -e "import {git} from './lib/git-env.mjs'; const r=git(process.cwd(), ['rev-parse','--git-dir']); console.log(r.status, r.stdout.trim());"`
  - (happy) 実行 → `status` が `0` で stdout が非空（環境の `GIT_DIR` を継承していない。継承すると `128` になる。worktree 下では `--git-dir` が絶対パスを返すので `.git` にはならない）
- cli: `NODE=$(command -v node); PATH=/nonexistent "$NODE" --input-type=module -e "import {git} from './lib/git-env.mjs'; const r=git(process.cwd(), ['rev-parse','--git-dir']); console.log(JSON.stringify({status:r.status, stdout:r.stdout, error:r.error}));"`
  - (error) 実行 → `{"status":1,"stdout":"","error":"spawnSync git ENOENT"}`（`status` の fallback と `error`）
  - _no case_: `error?` の型 — `checkJs` が無いので型は JSDoc。値は上のエラー case が持つ
  - _no case_: 3 か所が `git()` を通ること — 1 つ目の grep が 0 行であることで読む

## 2.実 git のテストを偽物へ

### Types

なし

### Steps

1. `.pi/extensions/consult/run/worktree.test.ts`:
   - `lib/git-env.mjs` を `vi.mock` で差し替え、`git` が返す `{ status, stdout, stderr }` をテストごとに決める。`repo()` と `runGit` の使用を消す。偽物は `vi.hoisted` で作る。
   - import は `test/tmp.ts` のまま（スライス 3 で変える）。
   - 残す判断: porcelain から consult の物だけを拾う、実体の無い登録を落とす、`rootFor` が同じルートを返す、`createWorktree` の branch と path と base と失敗時の後始末、`removeWorktree` の busy / missing / dirty / force / 未マージの枝 / ゴーストの prune、`cleanWorktrees` の 2 回目。
2. `.pi/extensions/consult/tool/worktree.test.ts`:
   - 同じ差し替えを使い、`repo()` を消す。id 無しのエラー、一覧の文、`removeText`、`runningIn` を残す。
   - import は `test/tmp.ts` のまま（スライス 3 で変える）。
3. `.pi/extensions/consult/run/git-env.ts`:
   - 消す。

### Verify:

- test: `pnpm test:run .pi/extensions/consult/run/worktree.test.ts .pi/extensions/consult/tool/worktree.test.ts`
  - (happy) porcelain に consult 以外の枝と `prunable` 行の囮を混ぜる → consult の実体ある物だけが出る
  - (happy) 登録に実体のある path と無い path → 前者だけが一覧に出る
  - (happy) 変更の残る worktree で `force` 無し → `dirty`
  - (happy) 変更の無い worktree → `dirty` が false
  - (empty) 登録が 0 → 一覧は空
  - (boundary) `busy` → `busy`、掃除をしない
  - (happy) `createWorktree` → branch は `consult/<id>`、path は `<root>/<id>/wt`、base は引数
  - (happy) `rootFor` → 同じ runRoot
  - (happy) `cleanWorktrees` の 2 回目 → 何も消さない
  - (happy) tool: id 無し → エラー、一覧の文、`removeText`、`runningIn`
  - (error) `worktree add` が status 1 → 例外、置き場の unit ディレクトリが残らない
  - (error) `worktree list` が status 128 → 一覧は空
  - (happy) 未マージの枝 → `removeWorktree` の後も枝が残る
  - (happy) 登録に無い id → `missing`
  - (happy) `force` → 変更が残っていても消える
  - (happy) 実体の無い登録 → `prune` で消え、`pruned` に path が入る
  - _no case_: `branchFor` — `consult/` の組み立てで、`createWorktree` の case が値を持つ
  - _no case_: `worktreeGit` が `error` を落とすこと — 読む側は status/stdout/stderr だけを使う
  - _no case_: git が引数を受け付けるか — 偽物では分からない。ADR の決定で利用時に受け取る

## 3.足場を外す

### Types

```ts
// test/temp-dir.ts
export function tempDir(prefix?: string): string;
```

### Steps

1. `test/temp-dir.ts`:
   - `test/tmp.ts` を写し、`tmpDir()` を `tempDir(prefix = 'test-')` にする。接頭辞は `mkdtempSync(join(tmpdir(), prefix))` に渡す。
2. `test/tmp.ts`:
   - 消す。
3. `test/setup.ts`:
   - 消す。
4. `test/env.test.ts`:
   - 消す。
5. `test/README.md`:
   - 消す。
6. `.pi/skills/adr/scripts/scaffold.test.ts`:
   - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
7. `.pi/extensions/consult/policy/types.test.ts`:
   - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
8. `.pi/extensions/consult/sub/guard.test.ts`:
   - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
9. `.pi/extensions/consult/run/delivery.test.ts`:
   - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
10. `.pi/extensions/consult/run/log.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
11. `.pi/extensions/consult/run/place.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
12. `.pi/extensions/consult/index.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
13. `.pi/extensions/consult/tool/consult.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
14. `.pi/extensions/consult/tool/subagents.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
15. `.pi/extensions/context-prune/command/prune.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
16. `.pi/extensions/context-prune/index.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
17. `.pi/extensions/context-prune/prune/ports.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
18. `.pi/extensions/context-prune/settings/read.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
19. `.pi/extensions/quality-gate/checks.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
20. `.pi/extensions/quality-gate/targets.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
21. `.pi/extensions/thinking-scrub/index.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
22. `.pi/extensions/thinking-scrub/settings/read.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
23. `scripts/checks/typecheck.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
24. `scripts/checks/typecheck-staged.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
25. `scripts/harness/index.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
26. `scripts/harness/list.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
27. `scripts/product-ready/index.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
28. `scripts/product-ready/targets.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
29. `.pi/extensions/consult/run/worktree.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
30. `.pi/extensions/consult/tool/worktree.test.ts`:
    - import を `test/temp-dir.ts` に変え、`tmpDir()` を `tempDir()` にする。
31. `vitest.config.ts`:
    - `TestConf` の型から `setupFiles` を消し、`base` から `setupFiles` とそのコメントを消す。
32. `scripts/harness/config.test.ts`:
    - `setupFiles` の検証を消す。`passWithNoTests` と `reporters` の検証は残す。
33. `scripts/harness/harness.json`:
    - `copy` を `test/temp-dir.ts` の 1 行にする。`test/setup.ts`、`test/tmp.ts`、`test/env.test.ts` の 3 行を消す。

### Verify:

- cli: `pnpm test:run` と `pnpm typecheck`
  - (happy) 実行 → `pnpm test:run` が全ファイル緑、`pnpm typecheck` が exit 0
  - _no case_: `setupFiles` の参照 — 参照が残れば vitest が setup ファイルを見つけられず赤くなる
  - _no case_: `tempDir(prefix)` の接頭辞 — 25 の呼び出しは無引数で、無視しても緑のまま。壊れても気づかない
  - _no case_: リポジトリの外に作ること — 統合の `git status` 前後比較が持つ

## 4.文書を合わせる

### Types

なし

### Steps

1. `.pi/extensions/consult/README.md`:
   - `:219` の `run/git-env.ts` の説明を消す。
   - `:234` の Tests 表から `(real repository)` を消す。
   - `:248` を、git を起動する口は `lib/git-env.mjs` の `git()` の 1 つで、テストは git を起動しない、という記述に書き換える。

### Verify:

- read: 作業するサブエージェントが `.pi/extensions/consult/README.md` を読み、4 点を報告する
  - (happy) (1) `run/git-env.ts` を指す案内が無い (2) `lib/git-env.mjs` の `git()` を唯一の起動口として名指ししている (3) テストは git を起動しないと書いている (4) Tests 表に `(real repository)` が無い → 4 点とも満たす
  - (error) 4 点のどれかが欠ける → 閉じない

## 5.統合: git の起動口が 1 つだけになる

### Types

なし

### Steps

1. `test/temp-dir.ts`:
   - 変更なし。`afterEach` が作った物をすべて消すことを読み、統合の前提にする。

### Verify:

- cli: `grep -rn "spawnSync('git'\|spawn('git'\|execFile('git'\|execSync('git'" --include=*.test.ts .` と `grep -rn "spawnSync('git'\|spawn('git'\|execFile('git'\|execSync('git'" lib .pi scripts` と `pnpm test:run` と `pnpm typecheck` と `git status --porcelain` の前後比較 と `node -e "console.log(require('./scripts/harness/harness.json').copy.filter((x) => x.startsWith('test/')))"`
  - (happy) 1 つ目 → 0 行（テストは git を起動しない）
  - (happy) 2 つ目 → `lib/git-env.mjs` の 1 行だけ
  - (happy) `GIT_DIR=/nonexistent node --input-type=module -e "import {git} from './lib/git-env.mjs'; const r=git(process.cwd(), ['rev-parse','--git-dir']); console.log(r.status, r.stdout.trim());"` → `status 0` で stdout 非空（worktree 下では `--git-dir` が絶対パスを返す。`GIT_DIR` を継承すると `128`）
  - (happy) 3 つ目 → 全ファイルが緑
  - (happy) 4 つ目 → exit 0
  - (happy) 5 つ目 → `pnpm test:run` の前後で同じ行（テストがリポジトリに書いていない）
  - (happy) 6 つ目 → `[ 'test/temp-dir.ts' ]`
  - (happy) 7 つ目 `ls "$(node -p 'require("os").tmpdir()')" | grep -c '^test-'` を `pnpm test:run` の前後で比べる → 同じ（`afterEach` が消している）
  - _no case_: 実行時間 — ADR の決定で目的ではない

## Notes

### Slice 1: 起動口を 1 つにする

- Findings:
  - plan の grep `spawn(` は `run.ts` の `spawn('pi', ...)`（サブエージェント起動）にも当たるため、字面どおりの「3 ファイル 0 行」にはならない。git 起動に限った grep では lib の 1 行だけ・3 ファイル 0 行を確認した。
    - left: `run.ts` は pi 起動に `spawn` が要る。plan の字面どおりには閉じられないので、git 限定で読んだ。
- Unplanned:
  - `changedFiles(git: GitRun)` の引数が import した `git` と衝突し lint `no-shadow` で落ちたので `gitRun` に改名した。呼び方は位置引数だけで変わらない。
  - `Verify` の git-spawn grep を git 限定（`spawn('git'` 等）に修正した。`spawn(` は `spawn('pi', ...)`（サブエージェント起動）にも当たっていたため。
  - `Verify` の `GIT_DIR` case の期待を `status 0` かつ stdout 非空に修正した。worktree 下では `rev-parse --git-dir` が絶対パスを返すため（`0 .git` にはならない）。`GIT_DIR` 継承で `128` になる点はそのまま。
- Commit: 70eacd4

### Slice 2: 実 git のテストを偽物へ

- Findings: なし
- Unplanned:
  - `tool/worktree.test.ts` の未使用 import（`writeFileSync`/`join`）を消し、`removed!` の非 null 表明を undefined 判定に直し、mock の `as` 表明を型付き `vi.fn` と `?? ''` の既定値に直した（lint が赤だったため）。
  - 偽物の `status` は明示の dirty 集合で返すようにした。readdir の有無で判定すると commit 済みの未マージまで `dirty` になっていたため。
  - 偽物の `prune` が消えた登録の孤児枝を登録するようにした。掃除が何も報告せずゴースト系の case が落ちていたため。
  - hoisted の既定実装の引数を `_cwd`/`_args` にし、`gitEnv` mock の `...(env ?? {})` を `...env` にした（lint が赤だったため）。
- Commit: 9d101cb

### Slice 3: 足場を外す

- Findings: なし
- Unplanned:
  - 改名は word-boundary 一括置換で行い、コメント内の `tmpDir()`/`test/tmp.ts` 言及も `tempDir()`/`test/temp-dir.ts` に揃えた。ファイルを消したまま古い名前の記述を残すと嘘になるため。
- Commit: f43a8a8

### Slice 4: 文書を合わせる

- Findings: なし
- Unplanned: なし
- Commit: d6caa08

### Slice 5: 統合: git の起動口が 1 つだけになる

- Findings: なし
- Unplanned:
  - 統合の git-spawn grep 2 本を git 限定（`spawn('git'` 等）に修正した。テストは `spawnSync('node', ...)` を使い、`proc.ts` の `ps` や pi 起動・`installDependencies` が残るため。
  - 統合の `GIT_DIR` case の期待を `status 0` かつ stdout 非空に修正した。worktree 下では `--git-dir` が絶対パスを返すため。
- Commit: 57d3dd9

### Clean: tests

- 同じ振る舞い（残した側が挙動を持つ）を落とした:
  - `run/worktree.test.ts`「変な id は git が断る」—「worktree add が status 1」と同じ失敗後始末。空白判定は偽物内部の話で、Verify が指す status-1 側を残した。
  - `run/worktree.test.ts`「変更の無い worktree → dirty が false」—「変更が残っている worktree → dirty」の前半と同じ。
  - `run/worktree.test.ts`「掃除する物が無い → pruned と branches は空」(remove)—「作って消す」2 回目の missing 側と同じ。
  - `run/worktree.test.ts`「options を渡さない」— dirty 既定は「force 無しでは断る」(無引数呼び)、force は force テスト、busy 既定は全面で暗黙に通る。
  - `run/worktree.test.ts`「ブランチは、取り込み済みなら一緒に消える」—「作って消す」前半の真部分集合。
  - `run/worktree.test.ts`「掃除する物が無い → 何も消さない」(clean)—「掃除してから 2 回目」の 2 回目と同一。
  - `typecheck.test.ts`「一覧が [] → root だけ」— `typecheck.mjs` は欠落と `[]` を同じ枝 (ENOENT→`[]`) で畳む。「一覧が無い」が ENOENT 枝を押さえるので残し、`[]` 側を落とした。
- 無くなった振る舞いのテスト: なし (`gitEnvFor`/`runGit`/`setupFiles`/`tmpDir`/`pi-test-` への参照はテストに残っていない。`worktreeGit` の error 退避を確かめるテストも無い)。
- 作らなくなった枝のテスト: なし。
- Verify: `pnpm test:run` 全 52 ファイル 837 tests 緑 (844 から落とした 7 を引いた数と一致)。

## Review

### Round 1

- Stale: なし
- Unlisted: なし
- Gaps:
  - `removeStatus` と `forEachRefStatus` と `forEachRefOverride` と `toplevelOverride` が既定値のまま一度も振られず、`worktree remove` 失敗と `for-each-ref` 失敗と出力差し替えの枝が運動しない — `.pi/extensions/consult/run/worktree.test.ts:34` / `.pi/extensions/consult/run/worktree.test.ts:36` / `.pi/extensions/consult/run/worktree.test.ts:37` / `.pi/extensions/consult/run/worktree.test.ts:38` / `.pi/extensions/consult/run/worktree.ts:356` / `.pi/extensions/consult/run/worktree.ts:277`（同様に `.pi/extensions/consult/tool/worktree.test.ts:25` / `.pi/extensions/consult/tool/worktree.test.ts:27` も一度も振られない）。
    - fixed: `worktree remove` 失敗と `for-each-ref` 失敗のテストを run に追加し（`removeStatus`/`forEachRefStatus` を振る）、使われない `toplevelOverride`/`forEachRefOverride` を消した。tool にも remove 失敗と for-each-ref 失敗のテストを追加した。
  - `scopes.json` が `[]` の入力がテストされず、`[] → root だけ` は欠落（`ENOENT → []`）の case だけが押さえ、空配列の正常系を通らない — `scripts/checks/typecheck.mjs:17` / `scripts/checks/typecheck.test.ts:108` / `cycles/261023-034-dev/plan/single-git-spawn.md:333`。
    - fixed: 「一覧が [] → root だけ」を復活させた（欠落 ENOENT 枝は「一覧が無い」が押さえ、`[]` は空配列の正常系として通る）。
  - `tool` の偽物だけが `readdir` の有無で dirty を決め、`run` が明示集合に直した修正と食い違い、`tool` 経由の dirty が運動しない — `.pi/extensions/consult/tool/worktree.test.ts:63` / `.pi/extensions/consult/run/worktree.test.ts:82` / `cycles/261023-034-dev/plan/single-git-spawn.md:298`。
    - fixed: tool の偽物を run と同じ明示 dirty 集合に揃え（`readdir` 判定をやめ、`makeDirty` を足した）、tool 経由の dirty（list の changed 表示と remove の dirty 拒否）のテストを追加した。
- Unproven:
  - `worktree add` 失敗の偽物が `mkdir` 前に返すため `unit` ディレクトリが作られず、`createWorktree` の `rmSync` を消しても同テストが緑のままになる — `.pi/extensions/consult/run/worktree.test.ts:287` / `.pi/extensions/consult/run/worktree.ts:196` / `.pi/extensions/consult/run/worktree.test.ts:92`。
    - fixed: add 失敗の偽物が置き場を作ってから失敗するように直し、`rmSync` を外すと同テストが赤くなることを確認して戻した。
- Doubts: なし

### Round 2

- Stale: なし
- Unlisted: なし
- Gaps: なし — fixedの3件が穴を塞ぐことを確認した。remove/for-each-ref失敗は`run/worktree.test.ts:507-509`と`run/worktree.test.ts:584-586`及び`tool/worktree.test.ts:209-213`と`tool/worktree.test.ts:215-222`が`removeStatus`/`forEachRefStatus`を振って投げを断定し、`toplevelOverride`/`forEachRefOverride`はgrepで残存なし（`listOverride`のみ残る）のため枝消しと一致する。`[]`は`typecheck.test.ts:119-129`が`writeScopes(root, [])`でrootだけを断定し`typecheck.mjs:17`の空配列正常系を通る形で、欠落の`typecheck.test.ts:108`と対をなす。toolのdirtyは`tool/worktree.test.ts:64`が明示集合に揃い`readdir`判定がなく、`tool/worktree.test.ts:137-139`の`makeDirty`と`tool/worktree.test.ts:194-204`がlistのchanged表示とremoveのdirty拒否を断定し`run/worktree.test.ts:82`と一致する。
- Unproven: なし — fixedの1件が穴を塞ぐことを確認した。add失敗の偽物は`run/worktree.test.ts:90`で置き場を作ってからstatus 1を返し、`run/worktree.ts:196`の`rmSync`がなければ`run/worktree.test.ts:282-287`の残らない断定が赤になる形で、戻し済みの`rmSync`と一致する。
- Doubts: なし

## Acceptance

- Ran:
  - `pnpm test:run` → 52 files / 843 tests 緑
  - `pnpm typecheck` → root: ok, .pi: ok
  - `grep -rn "spawnSync('git'\|spawn('git'\|execFile('git'\|execSync('git'" lib .pi scripts` → `lib/git-env.mjs:28` の 1 行
  - 同じ grep を `--include=*.test.ts .` → 0 行
  - `GIT_DIR=/nonexistent` で `git(process.cwd(), ['rev-parse','--git-dir'])` → `0 /.../.git/worktrees/wt`
  - `git status --porcelain` の `pnpm test:run` 前後 → 同じ 1 行（plan md のみ）
  - `scripts/harness/harness.json` の `copy` の `test/` → `[ 'test/temp-dir.ts' ]`
  - `ls "$tmpdir" | grep -c '^test-'` の前後 → 0 / 0
  - Slice 4 の read（README の 4 点） → 満たす
  - 壊し試験: `git()` の `env: gitEnv()` を外す → `GIT_DIR=/nonexistent` が `128`。戻すと `0`
  - 壊し試験: `test/temp-dir.ts` の `afterEach` を外す → `test-*` が 3 個残る。戻すと 0
  - 壊し試験: `parseWorktrees` の prunable 濾過を外す → `worktree.test.ts` が 3 本赤。戻すと 36 本緑
- Findings: なし
- Doubts: なし
