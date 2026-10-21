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
  - なし
- Unplanned:
  - なし
- Commit: 2140398 consult(liveness-start-token): record startToken on launch

### Slice 2: 生存の check を lstart にする

- Findings:
  - なし
- Unplanned:
  - worktree.test の unknown → busy でない を busy に直した（isRunning が unknown を走っている側にしたため、関連テストが落ちた）
- Commit: 7d38338 consult(liveness-start-token): check liveness via lstart

### Slice 3: 読み手を startToken に通す

- Findings:
  - Verify の 3 ファイル 78 件が通った。beginRun の startSound と controlSubagent の check の配線は state.check/defaultCheck 経由で既に startToken 側だったため、配線の変更は要らなかった
- Unplanned:
  - subagents.ts の 2 件の注釈が argv 照合のままだったので startToken/lstart に直した
  - consult.test.ts の describe が max-lines-per-function（240）を超えた（242）ので startToken の 2 件を別 describe に分けた
  - oxfmt の崩れ（subagents.test.ts）を直した
- Commit: 76aeafb consult(liveness-start-token): route readers via startToken

### Slice 4: 説明を合わせる

- Findings:
  - README の走っているかの記述を startToken と `ps -p <pid> -o lstart=` の一致に直し、読めないときは走っている側・`--name <token>` は表示名と書いた（一覧・worktree・停止・音の節）
- Unplanned:
  - read の指摘で音の節に unknown の規則（読めない pid は走っている側）を足した
- Commit: 5224bf7 consult(liveness-start-token): document the startToken check

### Slice 5: 統合: consult の生存判定

- Findings:
  - Steps は読みのみで変えず: `ps` の引数は `['-p', <pid>, '-o', 'lstart=']` で `-ww` なし、`test`/`test:run`/`test:related` は `--config vitest.starter.config.ts`
  - Verify の cli 4 件が通った: `test:run` exit 0（43 ファイル 777 件、consult を含む）、`typecheck` exit 0（root: ok、.pi: ok）、`lint` exit 0、`format:check` exit 0。落ちた行なし
- Unplanned:
  - なし
- Commit: 163eae8 consult(liveness-start-token): verify integrated liveness

## Review

### Round 1

- Stale:
  - tool/worktree.ts:95 と sub/spec.ts:41 の注釈が argv 照合のまま
    - fixed: startToken と `ps -o lstart=` の一致に直し、`--name` は表示名と書いた
- Unlisted:
- Gaps:
  - onStarted の失敗時（`readStartToken` が undefined → 開始行に startToken 無し）の case が無い
    - fixed: consult.test.ts の beginRun: startToken に ps 失敗時の case を足した
  - `readStartToken` の status 0 + 空/空白出力の case が無い
    - fixed: proc.test.ts に空と空白だけの case を足した（どちらも undefined、実装は変えず）
  - `checkPid` の空 startToken の case が無い
    - fixed: proc.test.ts に `''` → unknown・ps を叩かない case を足した（実装は変えず）
  - `defaultCheck` の startToken→checkPid 経路が差し替え不能
    - fixed: `run?: PsRun` 引数を足して export し、log.test.ts に ps 差し替えの case を足した
- Unproven:
  - ended 短絡の test が check の呼び出し回数を見ていない
    - fixed: 呼び出し回数を数えて 0 を確かめる形に直した
- Doubts:

## Acceptance

- Ran:
  - `pnpm test:run` → exit 0（43 files、773 tests）
  - `pnpm typecheck` → `root: ok`、`.pi: ok`、exit 0
  - `pnpm lint` → exit 0
  - `pnpm format:check` → exit 0
  - no case（壊し 1: `===` を `includes` に → `proc.test.ts` 1 件赤）
  - no case（壊し 2: `isRunning` を `=== 'running'` に → `log.test.ts` 3 件赤）
  - no case（壊し 3: `readStartToken` の trim を外す → `proc.test.ts` 4 件赤）
- Findings:
  - Stale: `tool/worktree.ts:95` の既定 check の注釈 → fixed: `startToken` → `lstart` に直した
  - Stale: `sub/spec.ts:41` の `token` の注釈 → fixed: 表示名の役割に直した
  - Gaps: `onStarted` の `readStartToken` 失敗 → fixed: `consult.test.ts` に件を足した
  - Gaps: `readStartToken` の空出力 → fixed: `proc.test.ts` に件を足した
  - Gaps: `checkPid` の空 `startToken` → fixed: `proc.test.ts` に件を足した
  - Gaps: `defaultCheck` の既定経路 → fixed: `run` の口を足し、`log.test.ts` に件を足した
  - Unproven: `ended` の短絡 → fixed: check の呼び出し回数を数える件にした
- Doubts:
  - `index.ts` の `announceRunningSubagents` は `check` を渡さないため、新しい任意引数がテスト専用に見える。reload 時の告知は `defaultCheck` に依存する。
  - 起動時の `readStartToken` 失敗は `pidAlive` に弱く後退し、そのことが記録にも表示にも残らない。
  - `lstart` の完全一致は開始時と判定時のロケールが同じことを前提にする。
