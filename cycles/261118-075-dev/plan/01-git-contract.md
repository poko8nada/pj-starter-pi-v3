# PLAN `git-contract`

- No: 02
- Place: worktree
- Boundary Plans: なし

## Goal

本物の git が出す形が、1本の契約テストで固定される。

## Refactor

- Inside:
  - Modules: なし。テストを1本足すだけで、既存のモジュールを分割も統合もしない。
  - Dirs: なし。
- Outside:
  - Extract: なし。既にある `orphanBranchesIn`（`run/worktree.ts`）と `tempDir()`（`test/temp-dir.ts`）を使い、新しい共有モジュールは作らない。これらの処理をテストの中で書き直すと、同じロジックが2箇所になるため。
  - Colocate: なし。共有をやめるモジュールはない。

## Files

```text
.pi/
  extensions/
    consult/
      run/
        git-contract.test.ts   add
        worktree.ts
      README.md                update
lib/
  git-env.mjs
test/
  temp-dir.ts
```

## Slices

## 1.本物の git が出す形を固定するテストがある

git の出力の形が、本物の git を走らせる1本のテストで固定される。

### Types

なし

### Steps

1. `.pi/extensions/consult/run/git-contract.test.ts`
   1. add: 取り込みと、リポジトリを用意する補助2つ。取り込みは、`vitest` の `afterEach`、`describe`、`expect`、`it`、`vi`、`node:fs` の `rmSync` と `writeFileSync`、`node:path` の `join`、`../../../../test/temp-dir.ts` の `tempDir`、`../../../../lib/git-env.mjs` の `git`、`./worktree.ts` の `orphanBranchesIn`。ダミーの名前は、ファイルの先頭に定数として1つずつ置く（`const FILE = 'hello.txt'`、`const CONTENT = 'hello\n'`、`const WT = 'wt1'`）。`describe('git contract')` を1つ置き、手順 1.2〜1.6の各ケースを1つの `it` にする（5つの `it`。名前はケースの文そのもの）。

      ```ts
      function initRepo(): string {
        const dir = tempDir('git-contract-');
        git(dir, ['init']);
        writeFileSync(join(dir, 'hello.txt'), 'hello\n');
        git(dir, ['add', 'hello.txt']);
        git(dir, ['-c', 'user.email=a@example.com', '-c', 'user.name=a', 'commit', '-m', 'init']);
        return dir;
      }

      /** worktree を置く場所。リポジトリの中に置くと status に現れるので、別の一時ディレクトリにする */
      function worktreeDir(): string {
        return tempDir('git-contract-wt-');
      }
      ```

   2. add: `happy: worktree を追加した直後の worktree list --porcelain → worktree、HEAD、branch の3行と空行`。各テストは `initRepo()` で新しいリポジトリを作る。`git(dir, ['worktree', 'add', '-b', 'wt1', join(worktreeDir(), 'wt1'), 'HEAD'])` を実行し、`git(dir, ['worktree', 'list', '--porcelain'])` の `stdout` を `\n\n` で分割する。空でない各ブロックが、`worktree `、`HEAD `、`branch refs/heads/` で始まる3行であることを確かめる。`path` と `hash` は可変なので、完全一致では比べない。
   3. add: `happy: 実体を消した worktree → prunable で始まる行が付く`。手順 1.2 と同じ準備のあと、worktree のディレクトリを `rmSync(<そのパス>, { recursive: true, force: true })` で消し、`git(dir, ['worktree', 'list', '--porcelain'])` の `stdout` に `prunable` で始まる行が現れることを確かめる。本物の git は `prunable gitdir file points to non-existent location` を出す（F1）。
   4. add: `happy: checkout 中のブランチと、checkout されていないブランチ → for-each-ref の各行が refs/heads/consult/<name> と2列目を持ち、orphanBranchesIn は checkout 中の行だけを捨てる`。`git(dir, ['worktree', 'add', '-b', 'consult/held', join(worktreeDir(), 'held'), 'HEAD'])` と `git(dir, ['branch', 'consult/free'])` で2つ作る。`const raw = git(dir, ['for-each-ref', '--format=%(refname) %(worktreepath)', 'refs/heads/consult/*']).stdout` を確かめる。`consult/held` の行は2列目にパスを持ち、`consult/free` の行は行末が半角空白1つである。`orphanBranchesIn(raw)` が `['consult/free']` を返す（`consult/<name>` の形で返る）。
   5. add: `happy: 未マージのブランチ → branch -d の終了符号が 1、branch -D の終了符号が 0`。`const wt = join(worktreeDir(), 'unmerged')` に `git(dir, ['worktree', 'add', '-b', 'consult/unmerged', wt, 'HEAD'])` でブランチを作り、その worktree で `writeFileSync` と `git(wt, ['-c', 'user.email=a@example.com', '-c', 'user.name=a', 'commit', '-m', 'more'])` により1つコミットを積む。`git(dir, ['worktree', 'remove', '--force', wt])` で checkout を外し、`git(dir, ['branch', '-d', 'consult/unmerged']).status` が 1、`git(dir, ['branch', '-D', 'consult/unmerged']).status` が 0 であることを確かめる。
   6. add: `error: 使えない GIT_INDEX_FILE（ディレクトリ）を設定した状態 → git() はそれでも一時リポジトリを見る`。`const dir = initRepo()` のあと `vi.stubEnv('GIT_INDEX_FILE', tempDir('git-contract-index-'))` を設定する。値は**ディレクトリ**にする。存在しないパスでは git が空の index として扱い終了符号 0 になるため、遮断の有無を区別できない。ディレクトリを指す index は git が開けないので、遮断が外れれば終了符号が 0 以外になる。`const result = git(dir, ['status', '--porcelain'])` が `status: 0` であることだけを確かめる（`stdout` の中身は見ない）。出力を見ないほうが、`Forbidden` の「3点と `GIT_*` の1点以外の出力を固定する」を守れる。
   7. add: `afterEach` で `vi.unstubAllEnvs()` を呼び、設定した `GIT_*` を戻す。ほかのテストに渡さないため。
2. Outside: `git` コマンド（`worktree list --porcelain`、`for-each-ref --format=%(refname) %(worktreepath)`、`branch -d` / `-D`、遮断の証拠に使う `status --porcelain`）
   1. update: `git-contract.test.ts` の中で、一時リポジトリに対してこれらのコマンドを呼ぶ（手順 1.2〜1.6）。`status --porcelain` は終了符号だけを見る。
3. Outside: `GIT_INDEX_FILE` を含む `GIT_*` 環境変数
   1. update: `git-contract.test.ts` の中で `vi.stubEnv('GIT_INDEX_FILE', ...)` を設定し、`afterEach` で戻す（手順 1.6、1.7）。
4. Outside: OS の一時ディレクトリに `git init` する一時リポジトリ
   1. update: `git-contract.test.ts` の中では、`tempDir()` が返したリポジトリと、別の `tempDir()` に置く worktree だけを `cwd` にする。プロジェクトのリポジトリは `cwd` にしない（手順 1.1〜1.3）。

### Policy

- Allowed:
  - `tempDir()` の中に `git init` して、本物の git を起動する - 契約を確かめるため。
  - `lib/git-env.mjs` の `git()` を通して起動する - `GIT_*` の遮断を受けるため。
  - 本物の git の出力の文字列と終了符号を断言に直接書く - design.md の「魔法数もハードコード文字列も持たない」の例外とする。本物の出力の形を固定することが、このテストの目的そのものであるため。
- Forbidden:
  - 偽物を本物の出力に合わせて直す - 出力を変えると既存テストの意味が変わるため。
  - 本番コードを変える - このエントリは検証を足すだけのため。
  - 3点と `GIT_*` の1点以外の出力を固定する - 関係のない git の変更で落ちないようにするため。
  - `spawnSync('git', ...)` を直接呼ぶ - `GIT_*` が子プロセスに渡る経路を作らないため。
  - プロジェクトのリポジトリで git を起動する - 本物のリポジトリを触らないため。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/run/git-contract.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、それが指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: other — `pnpm vitest run .pi/extensions/consult/run/git-contract.test.ts` が緑になる。赤になるのは、`lib/git-env.mjs` の `gitEnv()` から `GIT_*` を落とす処理を外したとき（手順 1.6）。

## 2.README が契約テストを例外として述べる

README の「テストは git を1つも起動しない」が、例外を伴って正しくなる。

### Types

なし

### Steps

1. `.pi/extensions/consult/README.md`
   1. update: 243行のうち、`and the tests replace it with a fake, so the test suite starts no git process.` を下の1文に置き換える。行番号は目印であり、置き換える範囲は引用した英文で決める。前半（`Git is started through one entry point only:` から `drops an inherited GIT_* before launching.` まで）は変えない。

      ```text
      and the tests replace it with a fake, so the test suite starts no git process except one contract test that runs the real git to pin its output.
      ```

### Policy

- Forbidden:
  - 「git の入口は1つ」「`GIT_*` を落とす」の2つの主張を変える - どちらも事実のままであり、変えると嘘になるため。

### Verify

- Always:
  - `pnpm test:run`（ドキュメントだけなので、関連テストはない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、それが指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: other — 変更後の `git diff .pi/extensions/consult/README.md` を見て、変わったのが `and the tests replace it with a fake, ...` の1文だけであることを確かめる。

## Notes

### Slice 1: 本物の git が出す形を固定するテストがある

- Findings: なし
- Unplanned:
  - `happy: 未マージのブランチ → branch -d の終了符号が 1、branch -D の終了符号が 0`（`.pi/extensions/consult/run/git-contract.test.ts`）— `writeFileSync` のあと `git(wt, ['add', FILE])` を足し、その後の `commit` が空にならないようにした。Steps 1.5 は `writeFileSync` と `commit` だけを書いているが、そのままでは staged な変更がなく `commit` が失敗し、ブランチが未マージにならず `-d` の期待（1）が成り立たないため。ここで直さないとテストが赤のままになるため。
  - `error: 使えない GIT_INDEX_FILE（ディレクトリ）を設定した状態 → git() はそれでも一時リポジトリを見る`（`.pi/extensions/consult/run/git-contract.test.ts`）— `GIT_INDEX_FILE` を存在しないパス（`join(dir, '..', 'no-such-index')`）からディレクトリ（`tempDir('git-contract-index-')`）に変え、ケース名も計画の手順 1.6 に合わせた。存在しないパスは git が空の index として扱い終了符号 0 になるため遮断の有無を区別できなかったが、ディレクトリを指す index は git が開けないので、遮断を外すと `status` が 128 になり赤になることを確かめた。計画の手順 1.6 更新に合わせた修正。
- Commit: b13b0370
- Stopped: なし

### Slice 2: README が契約テストを例外として述べる

- Findings: なし
- Unplanned: なし
- Commit: b5cb200c
- Stopped: なし

### Cleanup: なし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - なし。理由: 新テスト追加で古くなる文書・コメントはない。README のテスト一覧表（`.pi/extensions/consult/README.md:220-239`）に新テストの行はないが、Slice 2 の Steps と Verify が「`and the tests ...` の1文だけを変える」と決めており、ADR 02 の Update も同範囲のため計画決定値として指摘しない。`run/worktree.ts` のコメントや既存 fake の意味も変わらない。
- Unlisted:
  - なし。理由: 差分の変更は Files が指す `run/git-contract.test.ts:add`（新規 92 行）と `README.md:update`（1文）のみ。`lib/git-env.mjs`、`test/temp-dir.ts`、`run/worktree.ts` は参照のみで無変更であり、本番コード不変を保つ。plan md 自体の手順 1.6 更新と Notes 追記は計画運用の記録で Files の対象外。
- Gaps:
  - なし。理由: Goal（本物の git の形を1本で固定）に要る3点+`GIT_*`1点を5つの `it` が全て exercise する（1.2: 3行と空行、1.3: `prunable`、1.4: 2列目と `orphanBranchesIn`、1.5: `-d` 1・`-D` 0、1.6: `status` 0）。Verify Added の「緑＋遮断外しで赤」は Notes に 128 で赤確認の記録がある。`stderr` 全文や 255/128 等を固定しないのは Forbidden「3点以外の出力を固定するな」の決定通りであり欠けではない。
- Policy:
  - なし。理由: Slice 1 の Allowed 3点（`tempDir()` 内 `init`、 `git()` 経由、出力文字列と終了符号の直書き例外）を守る。Forbidden 5点（偽物修正なし、本番コード不変、3点+1点以外の固定なし、`spawnSync` 直呼びなし、プロジェクト repo 不使用）を全て保つ。Slice 2 の Forbidden（2主張を変えない）も保ち、README は1文のみ変更。
- Unproven:
  - なし。理由: 各 `it` は壊せば赤になる形である（1.2 は `blocks.length >= 2` と各 3 行 prefix、1.3 は `prunable` 有無、1.4 は held/free の行形と `orphanBranchesIn` 戻り、1.5 は 1/0、1.6 はディレクトリ index で遮断外し 128）。空出力や setup 失敗は赤側に倒れ、緑に倒れて見逃さない。
- Noise:
  - なし。理由: `'worktree '` 等の文字列や 1/0・3行等の数は Slice 1 Policy Allowed 3行目の例外（design.md の魔法数・ハードコード禁止の例外）として計画決定済みのため指摘しない。ダミーは `FILE`・`CONTENT`・`WT` 定数と `initRepo()`・`worktreeDir()` ファクトリに集約され（手順 1.1 通り）、`'more\n'` 等は単発前提で繰返しリテラルに当たらない。型等が保証する前提の再現や誰も気づかない振舞いのテストもない。
- Doubts:
  - なし。理由: Steps 1.5 が `add` を書かずコードが足している差は Notes Unplanned に理由付きで記録済みであり、所有者判断を要しない。1.2 の `>= 2` と `== 2` の差も、余分ブロックがあっても各ブロック形検査が効くため解消済みとして書かない。

### Round 2

- Stale:
  - なし。理由: Round 1 の指摘なし（`fixed:` なし）のため確認対象がない。
- Unlisted:
  - なし。理由: 同上。
- Gaps:
  - なし。理由: 同上。
- Policy:
  - なし。理由: 同上。
- Unproven:
  - なし。理由: 同上。
- Noise:
  - なし。理由: 同上。
- Doubts:
  - なし。理由: 同上。

## Acceptance

- Goal: 「本物の git が出す形が、1本の契約テストで固定される」— 達成した。5つの `it` が、porcelain の3行と空行、`prunable` 行、`for-each-ref` の2列と `orphanBranchesIn` の選択、`branch -d` と `-D` の終了符号、`GIT_*` の遮断を固定し、`README.md:243` の1文が契約テストを例外として述べる。
- Ran: `pnpm test:related .pi/extensions/consult/run/git-contract.test.ts`（5件）、`pnpm test:run`（67ファイル / 835件）、`pnpm typecheck`（root と .pi とも ok）、`pnpm lint`、`pnpm format:check`、`node scripts/checks/ja-check.mjs cycles/261118-075-dev/plan/01-git-contract.md`（error 0, warn 0）。赤になることの確認: `gitEnv()` から `GIT_*` を落とす処理を外すと5件目が `expected 128 to be +0` で赤（`1a6da6ec`）、`orphanBranchesIn` の `at !== ''` の選別を一時的に外すと4件目が `expected [...] toEqual ['consult/free']` で赤。どちらも復元して緑を確かめた。
- Findings: なし
- Doubts: なし
