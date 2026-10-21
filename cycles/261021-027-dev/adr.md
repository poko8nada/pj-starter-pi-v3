# ADR 027

## 01: consult が子の生存をどう見るか

### Context

- 025 の close で、全サブエージェントが終わった後に consult の音が鳴り続けた。026 は、実行ごとの UUID の token を子の argv の `--name` に載せ、`ps -p <pid> -o command=` の出力に token があるかで走っているかを決める形にした。
- 実際の子では、この前提が成り立たない。子の pi は起動時に `process.title = "pi"` を置き（`dist/cli/setup.js:3-6`）、`ps -o command=` は `pi` の 1 語を返す。`pgrep -f <token>` も 1 件も当たらない。`ps -Eww` でも command は `pi` のまま。
- 結果、`checkPid` は token を見つけられずに `ended` を返し、一覧は走っている子を `lost` と出し、音は止まり、エージェントは止まったと誤認して同じ仕事を走らせ直した。結果の届け（delivery）は壊れていない。結果は届いている。
- owner の求めは、025 の事故（pid の再利用で死んだ実行が生きて見える）と、026 の事故（生きている実行が止まって見える）の両方を起こさない判定である。owner は、公開されている pi の拡張が同じ問題をどう解いているかに習う形を選んだ。
- 026 の対応（`checkPid`、`isRunning`、`runningRuns`、`closeOrphans`、`subagent` の単位の読み）は土台として残す。変わるのは、走っているかを何で見るかである。

### Decision

- Status: **accepted**
- Adopted:
  - 開始行に `startToken` を残す。子の pid で起動直後に `ps -p <pid> -o lstart=` を読み、前後の空白を落とした文字列を記録する。`started` は残す。
  - 判定は `ps -p <pid> -o lstart=` を読み、出力を前後の空白を落として `startToken` と完全一致すれば走っている。pid が無ければ（exit 1・出力なし・stderr なし）走っていない。stderr があるなど読めないときは `unknown`。
  - `unknown` は走っているとして扱う。`pi-background-tasks` の `alive | pid-gone | pid-reused | unknown` に合わせ、読めないときに誤って止める側へ寄せない。
  - `started` と `lstart` を秒に丸めて ±1 秒で比べる形は採らない。開始時に読んだ文字列をそのまま残し、判定時に読んだ文字列と比べる。
  - `startToken` の無い古い行は `pidAlive` に落とす。2 日窓で消える。
  - `ps -o command=` と `pgrep -f` は判定に使わない。`--name <token>` は子のセッションの表示名としてだけ残す。
- Options:
  - A: pid と `lstart`（開始時刻）の照合。開始時の文字列を残して完全一致で見る。採る。
  - B: 常駐の `pi --mode rpc` の子と、セッションファイルからの復旧（`@chthub/pi-subagents` の形）。生存は stdio のパイプで分かるが、子の起動の形、delivery、記録の形が変わる。
  - C: reload のたびに開いている実行を interrupted にする（`danchamorro/pi-subagents` の形）。生存の照合を書かなくてよいが、reload をまたいで走る子を止まったと見せる。
  - `kill(pid, 0)` だけ（存在は分かるが、同一性は分からない。pid の再利用で偽陽性になる）。
  - argv と環境変数の token（子は `process.title` で argv を `pi` に書き換え、環境変数に子ごとの id は無い。`--no-session` の子はファイルも持たない）。
  - heartbeat と 1 回書きの状態ファイル（異常終了で古い値が残り、結局は開始時刻の照合が要る）。
  - 常駐の socket と flock（子側に仕組みを新設する。A で足りる）。

### Research & Trial

- `process.title` の書き換えは `dist/cli/setup.js:3-6`、`dist/bun/runtime-setup.js:7`、`dist/rpc-entry.js:5`。argv の `--mode json -p --name <token>` は `ps` から見えなくなる。実行中の子で `ps -ww -p <pid> -o command=` が `pi` を返すこと、`pgrep -f <token>` が exit 1 で当たらないことを確かめた。
- `--name` は `session_info` の行に名前を足すだけ（`dist/main.js:570-576`、`dist/core/session-manager.js:914-924`）。子の id は argv にも環境変数にも無い。`--no-session` の子はファイルを持たず、`--session <path>` の子は header の id と `session_info` をファイルに書く。
- `lstart` は `%c` のローカル表記で、`p_starttime.tv_sec` だけを使うため秒の解像度（`ps/print.c:690`）。出力は 28 桁に詰められる（`ps/keyword.c:126`）。
- 実行中の子で、記録の `started`（2026-10-21 12:41:12.405）と `ps -p <pid> -o lstart=`（`Wed Oct 21 12:41:12 2026`）が同じ秒であることを確かめた。開始時に読んだ文字列を残せば、秒に丸めずに完全一致で比べられる。
- `pi-background-tasks`（vanillagreen）は `ProcessIdentity {pid, startToken, comm}` を持ち、startToken は Linux なら `/proc/<pid>/stat`、それ以外は `ps -o lstart=`。判定は `alive | pid-gone | pid-reused | unknown` で、`unknown` は alive（`extensions/snapshot.ts:105-212`）。
- `pi-subagents`（nicobailon）は lease に `pid, hostname, processStartIdentity` を持ち、start identity は Linux のみ。`kill(0)` の EPERM は alive（`src/runs/shared/session-lease.ts:68-181`）。
- `danchamorro/pi-subagents` は reload で開いている実行を無条件に `interrupted` にする（`persistence.ts:139-171`）。`@chthub/pi-subagents` は resident の `pi --mode rpc` の子を持ち、生存は stdio のパイプで見て、セッションファイルから復旧する（`rpc-client.ts:81-120`、`index.ts:1452-1458`）。

### Definition Change

- なし
