# PLAN `liveness-start-token`

## Files

```text
.pi/extensions/consult/
  run/
    proc.ts                update
    proc.test.ts           update
    log.ts                 update
    log.test.ts            update
    subagent.ts            update
    subagent.test.ts
  sub/
    spec.ts                update
    spec.test.ts
  tool/
    consult.ts             update
    consult.test.ts        update
    subagents.ts           update
    subagents.test.ts      update
    worktree.ts
    worktree.test.ts
  index.ts                 update
  README.md                update
```

## 1.記録の startToken

### Types

```ts
// run/log.ts: RunRecord に足す
readonly startToken?: string;

// run/proc.ts: 子の pid から起動時刻の文字列を読む
export function readStartToken(pid: number, run: PsRun = defaultRun): string | undefined;
```

### Steps

1. `.pi/extensions/consult/run/log.ts`:
   - `RunRecord` に `startToken?: string` を足し、`parseRun` が文字列のときだけ拾う。
2. `.pi/extensions/consult/run/proc.ts`:
   - `readStartToken` を足す。`ps -p <pid> -o lstart=` を読み、前後の空白を落とした文字列を返す。pid が無い、stderr がある、status が 0 でないときは `undefined`。
3. `.pi/extensions/consult/tool/consult.ts`:
   - `onStarted` で `readStartToken(pid)` を呼び、開始行に `startToken` を入れる。`token` は残す。
4. `.pi/extensions/consult/run/log.test.ts`:
   - `parseRun` の `startToken` の往復、無い行、数値の行の件を足す。
5. `.pi/extensions/consult/run/proc.test.ts`:
   - `readStartToken` の件を足す。
6. `.pi/extensions/consult/tool/consult.test.ts`:
   - `onStarted` が開始行に `startToken` を書く件を足す（`PsRun` の差し替えで `ps` を偽物にする）。

### Verify:

- test: `.pi/extensions/consult/run/log.test.ts`、`.pi/extensions/consult/run/proc.test.ts`、`.pi/extensions/consult/tool/consult.test.ts`、`pnpm vitest run --config vitest.starter.config.ts .pi/extensions/consult/run/log.test.ts .pi/extensions/consult/run/proc.test.ts .pi/extensions/consult/tool/consult.test.ts`
  - (happy) `startToken` 付きの開始行 → 往復して同じ文字列が返る
  - (empty) `startToken` 無しの行 → `undefined` で読める
  - (error) `startToken` が数値の行 → 捨てて、行は読める
  - (happy) `readStartToken` で `ps` が `Wed Oct 21 12:41:12 2026\n` を返す → 前後の空白を落とした文字列
  - (boundary) `lstart` が 28 桁に詰められている → 前後の空白を落として一致する
  - (error) `ps` が exit 1 で出力なし → `undefined`
  - (error) `ps` が stderr を返す → `undefined`
  - (happy) `ps` に渡る引数 → `-p`、`<pid>`、`-o`、`lstart=` を含む
  - (happy) `onStarted` の開始行 → `startToken` が `readStartToken` の値と一致する（`ps` の偽物で固定）
  - (error) `readStartToken` に 0 以下・非整数の pid → `undefined`、`ps` を叩かない
  - _no case_: `ps` の `%c` のロケール差 — 親の `ps` をそのまま使うので、開始時と判定時で同じ環境になる

## 2.生存の check を lstart にする

### Types

```ts
// run/proc.ts: checkPid を置き換える
export function checkPid(pid: number, startToken: string, run: PsRun = defaultRun): Liveness;

// run/log.ts: defaultCheck の分岐
// startToken があれば checkPid(record.pid, record.startToken)、無ければ pidAlive(record.pid)
function defaultCheck(record: RunRecord): Liveness;
```

### Steps

1. `.pi/extensions/consult/run/proc.ts`:
   - `checkPid` を `(pid, startToken, run)` に変える。`ps -p <pid> -o lstart=` の出力を前後の空白を落として `startToken` と完全一致すれば `running`。stderr があれば `unknown`。pid が無ければ（exit 1・出力なし・stderr なし）`ended`。出力が違えば `ended`（pid の再利用）。
2. `.pi/extensions/consult/run/log.ts`:
   - `defaultCheck` を `record.startToken !== undefined ? checkPid(record.pid, record.startToken) : pidAlive(record.pid)` に変える。
3. `.pi/extensions/consult/run/log.test.ts`:
   - `defaultCheck` の分岐の件を、`startToken` の有無と `ended` の短絡で足す。
4. `.pi/extensions/consult/run/proc.test.ts`:
   - `checkPid` の件を `lstart` の形に置き換える。

### Verify:

- test: `.pi/extensions/consult/run/proc.test.ts`、`.pi/extensions/consult/run/log.test.ts`、`pnpm vitest run --config vitest.starter.config.ts .pi/extensions/consult/run/proc.test.ts .pi/extensions/consult/run/log.test.ts`
  - (happy) `lstart` が `startToken` と一致 → `running`
  - (happy) `lstart` が違う → `ended`（pid の再利用）
  - (error) pid が無い（exit 1・出力なし・stderr なし）→ `ended`
  - (error) stderr あり → `unknown`
  - (empty) `startToken` の無い行で `pidAlive` が true → 走っている（移行）
  - (empty) `startToken` の無い行で `pidAlive` が false → 走っていない
  - (happy) `startToken` 付きの行で check が `running` → true
  - (happy) `startToken` 付きの行で check が `ended` → false
  - (happy) `startToken` 付きの行で check が `unknown` → true（他の拡張に合わせ、読めないときは走っている側）
  - (boundary) `ended` のある行に check を渡す → false（短絡）
  - (boundary) `lstart` が `startToken` を含むが一致しない（前後に語がある）→ `ended`（部分一致では通らない）
  - (happy) `ps` に渡る引数 → `-p`、`<pid>`、`-o`、`lstart=` を含み、`-ww` を含まない
  - (error) 0 以下・非整数の pid → `ended`、`ps` を叩かない
  - (error) `status` が 2 → `unknown`
  - (error) `status` が null → `unknown`
  - (error) `status` 1 で出力あり → `unknown`
  - _no case_: 秒の境目 — 開始時に読んだ文字列を残して比べるので、時刻の丸めが入らない

## 3.読み手を startToken に通す

### Types

なし

### Steps

1. `.pi/extensions/consult/tool/subagents.ts`:
   - `SubagentsHost` に `check?: CheckRecord` を足し、`createSubagentsTool` の `list` が `listText(records, Date.now(), host.check)` を渡す。
2. `.pi/extensions/consult/index.ts`:
   - `announceRunningSubagents` の `runningRuns` に `check` を渡す（`host.check` と同じ口）。
3. `.pi/extensions/consult/tool/consult.ts`:
   - `beginRun` の `startSound` と `controlSubagent` の `check` の配線を、`startToken` ベースの `defaultCheck` に合わせる。
4. `.pi/extensions/consult/tool/subagents.test.ts`:
   - `list` の `check` の口が効く件を足す（`running` と `ended` を返す差し替えで一覧の状態が変わる）。偽物の host にも `check` の口を足す。
5. `.pi/extensions/consult/tool/worktree.test.ts`、`.pi/extensions/consult/tool/consult.test.ts`:
   - 既存の check 差し替えの件が `startToken` の行でも同じ答えになることを確かめる。

### Verify:

- test: `.pi/extensions/consult/tool/subagents.test.ts`、`.pi/extensions/consult/tool/worktree.test.ts`、`.pi/extensions/consult/tool/consult.test.ts`、`pnpm vitest run --config vitest.starter.config.ts .pi/extensions/consult/tool/subagents.test.ts .pi/extensions/consult/tool/worktree.test.ts .pi/extensions/consult/tool/consult.test.ts`
  - (happy) `list` に `running` を返す check → 一覧は走っている
  - (happy) `list` に `ended` を返す check → 一覧は `lost`
  - (happy) 開始行だけ + check が `running` の worktree → busy
  - (error) 開始行だけ + check が `unknown` の worktree → busy（走っている側）
  - (happy) 開始行だけ + check が `running` の停止 → kill する
  - (error) 開始行だけ + check が `ended` の停止 → kill しない
  - (error) 開始行だけ + check が `unknown` の停止 → kill する（走っている側）
  - (happy) `startSound` の述語が `state.check` を通る → 差し替えた check の `running` で鳴り、`ended` で止まる
  - _no case_: `announceRunningSubagents` の `check` の渡し — `index.ts` にテストが無い。acceptance の `look` で確かめる
  - _no case_: 5 秒のタイマー — `tool/sound.ts` の担当で、`sound.test.ts` が見る

## 4.説明を合わせる

### Types

なし

### Steps

1. `.pi/extensions/consult/README.md`:
   - 「走っている」の判定の記述を、`startToken`（`ps -p <pid> -o lstart=` の文字列）と、読めないときは走っている側に倒す規則に直す。`--name <token>` は表示名として書く。

### Verify:

- read: `review` サブエージェントが `.pi/extensions/consult/README.md` を読み、次を報告する
  - (happy) 走っているかの記述 → `startToken` と `lstart` の一致、`unknown` は走っている側、と読める
  - (happy) 一覧と音の記述 → 同じ規則で読めると読める
  - (empty) 判定の記述が無い → その旨を報告する（足さない）
  - (happy) `--name <token>` の記述 → 表示名として読める
  - _no case_: 文面の読みやすさ — 読む者の判断

## 5.統合: consult の生存判定

### Types

なし

### Steps

1. `.pi/extensions/consult/run/proc.ts`:
   - `ps -p <pid> -o lstart=` の引数を読み、`-ww` を付けていないこと（`lstart` は 28 桁に詰められ、幅で切れない）を確かめる。変えない。
2. `package.json`:
   - `test` / `test:run` / `test:related` の `--config vitest.starter.config.ts` を読む。変えない。

### Verify:

- cli: 作業ツリーで次のコマンドを打ち、出力と exit code を読む
  - (happy) `pnpm test:run` → exit 0、出力に `.pi/extensions/consult/` のテストファイルが出る
  - (happy) `pnpm typecheck` → root: ok、`.pi`: ok、exit 0
  - (happy) `pnpm lint` → exit 0
  - (happy) `pnpm format:check` → exit 0
  - _no case_: 本物の subagent を走らせて音が止まること — acceptance の `look` で確かめる。acceptance の `Ran` に `look` の結果を書く
  - _no case_: `lstart` の `%c` のロケール差 — ハーネスの環境が 1 つで、開始時と判定時が同じ

## Notes

### Slice 1: 記録の startToken

- Findings:
- Unplanned:
- Commit:

### Slice 2: 生存の check を lstart にする

- Findings:
- Unplanned:
- Commit:

### Slice 3: 読み手を startToken に通す

- Findings:
- Unplanned:
- Commit:

### Slice 4: 説明を合わせる

- Findings:
- Unplanned:
- Commit:

### Slice 5: 統合: consult の生存判定

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
