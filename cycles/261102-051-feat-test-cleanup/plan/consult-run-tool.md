# PLAN `consult-run-tool`

- No: 01

## Files

```text
.pi/extensions/consult/
  run/
    delivery.test.ts   update
    log.test.ts        update
    place.test.ts      update
    proc.test.ts       update
    worktree.test.ts   update
  tool/
    commit.test.ts     update
    run.test.ts        update
```

## Slices

## 1.proc と place の統合と削除

### Types

なし

### Steps

1. `.pi/extensions/consult/run/proc.test.ts`:
   - (happy) `checkPid` と `readStartToken` に同じ `PsRun` を渡す → どちらも `-p`、`String(pid)`、`-o`、`lstart=` を受け取り、`-ww` を受け取らない。`it('ps に渡る引数 → -p、<pid>、-o、lstart= を含み、-ww を含まない')` と `it('ps に渡る引数 → -p、<pid>、-o、lstart= を含む')` を、`describe('ps の引数')` のこの1本に統合する。期待値は `pid` の変数から取る。
   - (error) `0`、`-5`、`3.5` の pid を渡す → どちらの関数も `ps` を叩かず、`checkPid` は `ended`、`readStartToken` は `undefined` を返す。`it('0 以下・非整数の pid → ended（ps を叩かない）')` と `it('0 以下・非整数の pid → undefined（ps を叩かない）')` を、`describe('ps の引数')` のこの1本に統合する。
2. `.pi/extensions/consult/run/place.test.ts`:
   - (empty) 保存場所がない → `windowFiles` と `oldFiles` のどちらも `[]` を返す。2本の `it('保存場所がない → []')` を1本に統合する。
   - `it('30 日より古いだけを返し、ちょうど 30 日前は残す')` を削除する。ちょうど30日前は読む窓の外にあり、誰も気づかない。
3. 入力から取る値は、テストの中でその値を渡す変数から取る。`consult.fixture.ts` は変えない。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/run/proc.test.ts .pi/extensions/consult/run/place.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E '30 日より古いだけを返し' .pi/extensions/consult/run/place.test.ts`
  - `test "$(grep -c 'ps に渡る引数' .pi/extensions/consult/run/proc.test.ts)" = 0`
  - `test "$(grep -c 'ps の引数' .pi/extensions/consult/run/proc.test.ts)" = 1`
- Added: なし

## 2.log の統合と削除

### Types

なし

### Steps

1. `.pi/extensions/consult/run/log.test.ts`:
   - (boundary) 数値の `startToken` と数値でない `delivered` を持つ行 → どちらも捨てて、行は読める。`it('startToken が数値の行 → 捨てて、行は読める')` と `it('delivered "x" 落とす')` を1本に統合する。期待値は入力の変数から取る。
   - `it('token が数値の行 → token を捨て、行は読める')` を削除する。数値の `token` は製品のどこからも読まれない。
   - `it('startToken なしの行は ps を叩かず pidAlive で決まる')` を削除する。`scanned` の進みだけが変わる。
   - `it('行がない → 何も書かない')` を削除する。空の入力で書く行がない。
   - `it('startToken なしの行で pidAlive が true → 走っている（移行）')` を削除する。`startToken` なしの行は旧形であり、届かない。
   - `it('token なしの行は pidAlive で決まる（移行）')` を削除する。同じ理由である。
   - `it('token と startToken のない行（古い形）→ どちらも undefined で読める')` を削除する。同じ理由である。
2. 入力から取る値は、テストの中でその値を渡す変数から取る。`consult.fixture.ts` は変えない。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/run/log.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E 'startToken なしの行は ps を叩かず|token なしの行は pidAlive で決まる|token と startToken のない行|token が数値の行|行がない → 何も書かない' .pi/extensions/consult/run/log.test.ts`
  - `test "$(grep -c 'startToken が数値の行' .pi/extensions/consult/run/log.test.ts)" = 0`
  - `test "$(grep -c 'delivered "x" 落とす' .pi/extensions/consult/run/log.test.ts)" = 0`
  - `test "$(grep -c '数値の startToken と数値でない delivered' .pi/extensions/consult/run/log.test.ts)" = 1`
- Added: なし

## 3.run の残りの削除と tool の削除

### Types

なし

### Steps

1. `.pi/extensions/consult/run/delivery.test.ts`:
   - `it('古い ended の欄を消し、新しい欄を残す')` を削除する。掃除は保存場所を小さく保つだけで、誰も読まない。`describe('pruneCursors')` が空になるため、`describe` ごと削除する。
2. `.pi/extensions/consult/run/worktree.test.ts`:
   - `it('台帳ファイルを持たない → 一覧は git から作る')` を削除する。台帳なしの一覧は届かない。
3. `.pi/extensions/consult/tool/run.test.ts`:
   - `it('input を渡しても引数として拾わない（面にない）')` を削除する。ホストは未知の欄を落とさないが、読まれない。
   - `it('role がない → 使い方つきで投げる')` を削除する。`PARAMETERS` が `role` を必須にしている。
   - `it('オブジェクトでない → 投げる')` を削除する。ホストが `execute` の前に検証する。
   - `it('continue が真偽値でない → 既定（未指定）にする')` を削除する。ホストが真偽値に変換する。
4. `.pi/extensions/consult/tool/commit.test.ts`:
   - `it('message を渡しても引数として拾わない（型は道具が作る）')` を削除する。`message` は読まれない。
5. 製品の出力文を確かめる断言（`no change`、`committed: `、`rejected: `）は削除しない。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/run/delivery.test.ts .pi/extensions/consult/run/worktree.test.ts .pi/extensions/consult/tool/run.test.ts .pi/extensions/consult/tool/commit.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E '古い ended の欄を消し|台帳ファイルを持たない|input を渡しても引数として拾わない|role がない → 使い方つきで投げる|オブジェクトでない → 投げる|continue が真偽値でない|message を渡しても引数として拾わない' .pi/extensions/consult/run/delivery.test.ts .pi/extensions/consult/run/worktree.test.ts .pi/extensions/consult/tool/run.test.ts .pi/extensions/consult/tool/commit.test.ts`
  - `test "$(grep -c 'pruneCursors' .pi/extensions/consult/run/delivery.test.ts)" = 0`
  - `grep -q 'no change' .pi/extensions/consult/tool/commit.test.ts`
  - `grep -q 'committed: ' .pi/extensions/consult/tool/commit.test.ts`
  - `grep -q 'rejected: ' .pi/extensions/consult/tool/commit.test.ts`
- Added: other — `pnpm test:run .pi/extensions/consult/run .pi/extensions/consult/tool` で件数を数え、223 から減った件数を ## Notes に書く

## Notes

### Slice 1: proc と place の統合と削除

- Findings: なし
- Unplanned: なし
- Commit: 5ffe2de consult(consult-run-tool): merge ps args and empty place tests
- Stopped: なし

### Slice 2: log の統合と削除

- Findings: なし
- Unplanned: なし
- Commit: d543d92 consult(consult-run-tool): merge boundary parse tests and drop migration tests
- Stopped: なし

### Slice 3: run の残りの削除と tool の削除

- Findings: なし
- Unplanned: なし
- Commit: d5e600f consult(consult-run-tool): drop prune and unused tool input tests
- Stopped: なし
- 件数: run + tool で 205 件（223 から 18 件減）

### Cleanup: 空入力テスト・重複テスト・ホスト保証済み断言の削除

- Findings: なし
- Unplanned: なし
- Commit: cced330 consult(consult-run-tool): cleanup tests

## Work Review

### Round 1

- Stale: なし — 削った名の grep は consult 配下に残らず、取り込んだ型とテストを助ける局所関数 (writeCursorFile、CheckRecord、PsRun、ensureRoot) の残用も確認した。
- Unlisted: なし — name-only の 7 件は Files の 7 件と一致する (plan md の Notes 記入を除く)。
- Gaps:
  - `.pi/extensions/consult/tool/run.test.ts:14` — `continue: false` の透過を確かめる検査がなく、`it('worktree と continue を渡せる')` は `continue: true` のみを通し、下流 `.pi/extensions/consult/tool/consult.ts:409` の `??` が false と未指定を区別するため、false を落とす壊れが緑のまま残る。
    - fixed: `it('worktree と continue を渡せる')` に `continue: false` の場合を足し、`false` が欄ごと落ちず未指定（欄なし）と区別されることを断言した。
- Unproven: なし — 統合後の各 it が両行動を断言し (ps 引数の両関数、windowFiles と oldFiles、startToken と delivered の破棄)、壊せば赤になることを目視した。
- Noise: なし — 統合後の値は変数から取り (pid、at、window、keep、startToken、delivered)、残る文字列は Steps が決めた ps 引数と製品の出力文である。
- Doubts:
  - cced330 が Steps にない 5 件 (delivery の `行が 0 本 → 空`、log の runningRuns の `行がない → 空`、worktree の `ワークツリーが 1 つもない → 空`、run の `continue: false も渡せる`、commit の非オブジェクト断言の除去) を削り、Notes の Cleanup 表題と Findings/Unplanned なしのみで記録され Commit 行がないため、表題がこれらを覆うかは close の判断に残る。
  - Gaps の 1 件を除き、Steps 外の削除は空入力・ホスト保証済みと同種で Test cases の規則に沿うため、所見にしなかった。

### Round 2

- Stale: なし — Round 1 の `fixed:` は `Gaps` の 1 件だけであり、`Stale` には `fixed:` がないため対象外である。
- Unlisted: なし — 同じ理由により、`Unlisted` には `fixed:` がないため対象外である。
- Gaps: なし — fixed 1 件を確認。`.pi/extensions/consult/tool/run.test.ts:14-31` が同じ `it` 内で `continue: true` が通ること、`continue: false` が `continue: false` として残ること、未指定が欄なしになることを断言するため、修正済みである。理由は、実装 `.pi/extensions/consult/tool/run.ts:72` が `typeof === 'boolean'` で欄を残す構造であり、`false` を落とす壊れ（真値判定化）や既定値化はこの断言が失敗し、下流 `.pi/extensions/consult/tool/consult.ts:409` の `??` が頼る `false` と未指定の区別を守れることである。
- Unproven: なし — 同じ理由により、`Unproven` には `fixed:` がないため対象外である。
- Noise: なし — 同じ理由により、`Noise` には `fixed:` がないため対象外である。
- Doubts:
  - Doubts: なし — `Doubts` には `fixed:` がなく、新たに所見に至らない疑義もない。

## Acceptance

- Ran: `pnpm test:run`（62 本、764 件）と `pnpm typecheck` をワークツリーで実行し、緑。plan の `Always` は各スライスの `Verify` で実行済み。`Added` はなし。この plan は振る舞いを足さずテストを削るため、壊して赤を確かめる対象はない。差分を読み、テストの削除と統合だけであることを確かめた。
- Findings: なし
- Doubts: なし
