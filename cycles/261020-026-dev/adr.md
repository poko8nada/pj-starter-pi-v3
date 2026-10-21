# ADR 026

## 01: consult が「サブエージェントが走っているか」をどう決めるか

### Context

- 025 の close で、全サブエージェントが終わった後に consult の音が 5 秒ごとに鳴り続けた。`consult-4` の開始行（`ended` 無し、`pid: 2502`）が残り、その pid が後に WebKit に再利用されたため、`isRunning` が「走っている」と返し続けた。
- 記録は追記だけの JSONL で、1 実行が開始行と終了行（と `notice` 行）のスナップショットを持つ。現在の状態は「同じ subagent の最後の行」で読むのが本来の形で、一覧と停止はそうしている。音・告知・busy は `runningRuns` の行単位の判定を使い、終了行があっても開始行を「走っている」と読む。
- 終了行を書くのは親の `.then/.catch` だけ。親が SIGKILL や reload で消えると、子が残っても終了行は残らない。「終了行が無い」が「走っている」と「親が死んだ」の両方を意味する。
- owner は、場当たりの畳み込みではなく、pid 再利用・親の死・終了行の欠落に強い判定を根幹から求めている。
- pi 1.3.0 には、セッションや並行の子の生存を扱う仕組みが無い。セッションは素の JSONL で lock も pid も持たず、一覧 API は `messageCount` / `modified` などのメタデータだけ、`--mode json -p` に run のレジストリは無い。`proper-lockfile` は settings / auth / trust / MCP にだけ使われ、セッションには使われない。子を追跡するのは呼び出し側の仕事である。
- 子は `--no-approve` でプロジェクトの拡張を読まず、guard と budget だけを読む。子側に何かを持たせるなら、子側の拡張を新設することになる。
- 記録に任意の欄を足すのは旧行を壊さない。`ended` の型や意味を変えると delivery のカーソル（`ended` の単調性、同値は `>` で落ちる）とテストが壊れる。

### Decision

- Status: **accepted**
- Adopted:
  - 実行ごとに UUID の token を作り、子の argv に `--name <token>` として渡す（`sub/spec.ts` の `buildPiArgs`）。開始行に `token` を残す。pid はプロセスを引くための値として残す。
  - 判定は「記録の pid のプロセスの argv に token があるか」。`ps -ww -p <pid> -o command=` でその pid の argv を直接読み、token があれば走っている。pid が無ければ（exit 1・出力なし・stderr なし）走っていない。`ps` のエラー（stderr あり）は不明として走っていない側に倒す。
  - 読みは subagent の単位に揃える。同じ subagent に `ended` の行が 1 つでもあれば終わり。音・告知・busy・一覧が同じ規則を使う。
  - `ended` の無い開始行で token が合わないものは、セッション開始時に終了行で閉じる（`state: 'error'` と理由）。delivery の `ended` の意味は変えない。
  - token の無い古い行は `pidAlive` に落とす。2 日窓で消える。
- Options:
  - 開始時刻（`ps -p <pid> -o lstart=`）を記録して照合する（reuse に強いが、`ps` の出力の形と秒の解像度に依存する。token はそこに依存しない）
  - 子が socket を持つ（reuse に最も強いが、子側の拡張を新設する。今回は子側をスコープ外にする）
  - 子が heartbeat を書く（検出がリースの期限だけ遅れ、スリープやイベントループの停止で偽の死になる。子側の拡張が要る）
  - 親のメモリ上の実行表だけ（親が生きている間は正確だが、reload / SIGKILL で消える。同一性が結局要る）
  - env の token を `ps -Eww` で読む（動くが、子の env には API キーが入る。出力を扱う経路が増える）
  - `--session-id` に token を載せる（`--session` / `--continue` / `--resume` と併用できない。`docs/cli.md:107`）
  - セッションの mtime や entry を heartbeat にする（進捗で、生存ではない。`--no-session` の子にはファイルが無い）
  - `pgrep -f <token>` で逆に引く（記録の pid が出力にあるかを見る。token ごとに 1 回呼ぶ必要があり、複数の token をまとめた正規表現は、再利用された pid が別の実行の token に当たって偽陽性になる。エラーの区別だけが `ps` より楽）
  - 不明の時に `pidAlive` に落とす（再利用された pid で古い偽陽性が戻り、停止がその pid を kill し得る）

### Research & Trial

- pi 1.3.0 のセッションは `~/.pi/agent/sessions/` の JSONL。ヘッダは `{type:"session", version:3, id, timestamp, cwd, parentSession}` だけ（`docs/session-format.md:64-76`、`dist/core/session-manager.js:691-704`）。
- セッションの I/O は素の `fs`（`appendFileSync` / `openSync`）。lock も pid も書かない。`wx` は初回作成の 1 回だけ（`dist/core/session-manager.js:794-814`）。
- 同じセッションを 2 つの pi が開いても止まらず、互いに追記する（`dist/core/session-manager.js:1326-1348,815-820`）。検出も修復もしない。
- `proper-lockfile` は settings / auth / trust / MCP / package-manager で使われる（`dist/core/settings-manager.js:132`、`dist/core/auth-storage.js:50`、`dist/core/trust-manager.js:114`、`dist/extensions/mcp/oauth.js:110-129`）。セッションの書き込み経路ではない。
- `--mode json -p` は stdout にイベントを流して終わる。run id も状態ファイルもレジストリも無い（`dist/modes/print-mode.js:15-145`）。`--no-session` の子はファイルを持たない。
- env の token は実際に読める。detached の子で `ps -Eww -p <pid> -o command=` に `CONSULT_TOKEN=...` が出た（小さな env で 1173 文字、ネイティブ依存なし）。
- `--name` は CLI が `appendSessionInfo(name)` を呼び、`session_info` の行を 1 行足すだけ（`dist/main.js:573-576`、`dist/core/session-manager.js:913-925`）。id・パス・メッセージは変わらない。表示名は最新の `session_info` が使われる（`dist/core/session-manager.js:515-518`）。
- `--session-id` は `--session` / `--continue` / `--resume` と併用できない（`docs/cli.md:107`）。続きに使えるのは `--name` である。
- `ps -p <pid> -o lstart=` は `Tue Oct 20 18:00:07 2026` を返す（秒まで、同じ値が返る）。10 回で 21 ms、`ps -p a,b -o pid=,lstart=` でまとめられる。
- `ps -ww -p <pid> -o command=` は、存在する pid で exit 0 と argv を返す。存在しない pid で exit 1・出力なし・stderr なし。範囲外の pid で exit 1・stderr あり。`-p a,b` は 1 つでも存在すれば exit 0 で、存在する行だけを返す。
- `ps` の `command` は argv だけで env を含まない（`-E` を付けた時だけ env が出る）。`-ww` を付けないと幅で切れる。
- `pgrep -f <当たらない語>` は exit 1、壊れた正規表現は exit 2。token ごとの呼び出しは安全だが、複数 token を 1 つの正規表現にまとめると、記録の pid が別の実行の token に当たる偽陽性がある。
- 今の `runningRuns` は行単位で、`isRunning` は `ended === undefined && pidAlive(pid)`（`run/log.ts:82-84,176-181`）。一覧は `latest` で畳む（`tool/subagents.ts:82-88`）。busy は全行を直接見る（`tool/worktree.ts:99-107`）。
- `runningRuns` のテストは、開始行だけの subagent と終了行だけの subagent を置く。同じ subagent に開始行と終了行の両方がある場合は無い（`run/log.test.ts:164-185`）。
- 音のタイマーは 5 秒ごとに述語を読み直す（`tool/sound.ts:68-79`）。

### Definition Change

- なし

## 02: `scripts/harness/index.mjs` の重複をどう消すか

### Context

- `scripts/harness/index.mjs:93-97` は `~` と `~/` の枝と `~foo` の枝が同じ本文で並ぶ。`:98` は `path.isAbsolute(root) ? path.resolve(root) : path.resolve(root)` で、両枝が同じ。
- 025 の `ex-harness-root` の review が `:98` の三項をコードの冗長として挙げ、finding にはしなかった（Stale は文書・コメント・テストが対象）。close の 6 行目として次のサイクルに回した。
- owner は、古い実装や重複は残さず消す方針を出している。
- 振る舞いは変えずに消せる。`~`、`~/x`、`~foo` は `slice(1)` の結果が違うだけで、`path.join(home, ...)` は同じ。`scripts/harness/index.test.ts` に `~/...`、`~` 単体、`~foo`、相対の `../starter`、`same` のケースがある。

### Decision

- Status: **accepted**
- Adopted:
  - `~` の扱いを `if (expanded.startsWith('~'))` の 1 本にまとめ、本文は `path.join(os.homedir(), expanded.slice(1))` のままにする。
  - `rootAbs` を `path.resolve(root)` にする。
  - テストは変えない。冗長が消えたことは `read` で確かめる。
- Options:
  - 残す（owner の「重複は消す」に反する）

### Research & Trial

- 現在の本文は 2 枝とも `path.join(os.homedir(), expanded.slice(1))`（`scripts/harness/index.mjs:93-97`）。
- `path.join(home, '')` は `home`、`path.join(home, '/x')` は `home/x`、`path.join(home, 'foo')` は `home/foo`。3 つの入力で本文は同じ。
- `root` は `process.cwd()` で絶対パス（`scripts/harness/index.mjs:404`）。三項の両枝は `path.resolve(root)` で同じ。
- `scripts/harness/index.test.ts` の 42 本が `~` の 3 形、相対、`same` を覆う。振る舞いは前後で同じなので、テストは冗長の有無を区別しない。
- 冗長の有無は `read` で確かめる。テストでは確かめられない。

### Definition Change

- なし
