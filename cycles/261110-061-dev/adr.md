# ADR 061

## 01: 動いているサブエージェントの数を、エディタの上にどう表示するか

### Scope

- In:
  - behaviour: consult は、サブエージェントが 1 体以上動いている間、エディタの上に役割ごとの数を 1 行で出す。出すのは動いている役割だけで、0 体になったら表示を消す。リロードの前から動いているものも含める。
  - format: 1 行の形（`res:2 pro:1`）、区切り、役割の並び順を決める。
  - naming: 役割の短い名前（`res`、`rev`、`pro`、`tri`、`cod`）を決める。
  - refactor: 数を集める処理と `setWidget` を呼ぶ位置を、`tool/consult.ts` と `index.ts` の中で決める。
  - errors: 表示の更新が失敗しても、consult はサブエージェントの実行、音、完了報告を止めない。
  - compatibility: consult は、リロードをまたいだ稼働をいまの session の記録（`run/log.ts`）から数え、`/consult-status` の文面と食い違わないようにする（コマンドの存廃は 03）。
  - logs and monitoring: consult は、稼働の信号としてウィジェットを出す。既存の音と完了報告は変えない。
  - prose: `consult` の README に、表示についての 1 段落を足す。
- Out:
  - dependency: 新しいパッケージは入れない（pi の `setWidget` で足りるため）。
  - speed: 表示の更新頻度の上限は設けない（1 行で軽いため）。
  - security: 秘密情報、権限、露出は扱わない（出すのが役割と数だけのため）。
  - deploy: 配布やリリースはしない（対象がないため）。
  - migration: 過去の記録は移行しない（残すものがないため）。

### Context

- C1: pi の拡張は `ctx.ui.setWidget` でウィジェットを出せる（前提）。
- C2: いまの consult は、走っているサブエージェントをメモリの `Map` と記録の両方で管理し、5 秒ごとの tick で記録を読み直して音を鳴らすが、画面には出していない（前提）。
- C3: オーナーの要望は、エディタの上に 1 行のカウンタを出すことであり、出すのは動いている役割だけで、0 体になったら表示自体を出さないことである（制約）。
- C4: 役割は 5 つ（`research`、`review`、`proofreader`、`trial`、`code`）であり、短い名前は名前の先頭 3 文字とし、並び順は `types.json` の並びとする（制約。オーナーの回答）。
- C5: consult は、表示を既存の 5 秒ごとの tick でセットし直し、`session_start` では最初の描画のために 1 回セットする（オーナーの回答）。
- C6: リロードが走ってもサブエージェントは止まらないため、表示にはリロードの前から動いているものも含まれる（オーナーの回答）。
- C7: consult は、既存の音と完了報告を変えない（制約）。
- C8: 表示が数えるのはいまの session の記録だけとし、`/new` の前のセッションで動いているものは含めない（オーナーの回答）。

### Research & Trial

- F1 (C1): ウィジェットを出すための関数は `ctx.ui.setWidget(key, content, options?)` で、`placement` の既定は `aboveEditor` である。`content` は文字列の配列か、`TUI` と `Theme` を受け取って部品を返す関数である。出所: `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts:47-52`、`:100-104`。
- F2 (C1): 同じキーで `setWidget` を呼び直すと表示が置き換わり、`undefined` を渡すと表示が消える。Interactive は、設定の直後に描画を要求する。出所: `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1853-1885`、`:1931-1952`。
- F3 (C3): 文字列の配列を渡すとき、1 回の呼び出しで表示できるのは 10 行までである。超えた分は `... (widget truncated)` の 1 行にまとめられる。関数を渡す場合には、この切り詰めはない。出所: `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1868-1877`、`:1926-1927`。
- F4 (C6): リロードの前に `resetExtensionUI` がウィジェットを消すため、読み直された拡張はウィジェットの値をセットし直す必要がある。pi の例は `session_start` で状態から作り直している。出所: `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:366-368`、`:1887-1911`、`:5328-5337`、`node_modules/@earendil-works/pi-coding-agent/examples/extensions/plan-mode/index.ts:344-393`。
- F5 (C3): consult は、文字列の配列を渡す前に `ctx.ui.theme.fg` と `bg` で着色する。テーマの色を含む文字列を保持すると、テーマを変えたときに古い色が残るため、保持しない。出所: `node_modules/@earendil-works/pi-coding-agent/docs/tui.md:148-174`、`:170`、`node_modules/@earendil-works/pi-coding-agent/examples/extensions/plan-mode/index.ts:63-79`。
- F6 (C1): UI のないモード（JSON、print）では `setWidget` は何もしない。RPC では文字列の配列だけが転送され、関数は無視される。出所: `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/runner.js:132-143`、`node_modules/@earendil-works/pi-coding-agent/docs/rpc-extension-ui.md:8-9`、`:129-144`。
- F7 (C6): サブエージェントは `detached: true` で起動するため、pi のプロセスが終わっても走り続ける。consult は `runningRuns` を session で絞るため、リロードでは同じ session id のまま記録を読めるが、`/new` のあとは別の id になり、生きているサブエージェントはこの絞り込みに入らない。出所: `.pi/extensions/consult/run/run.ts:168`、`:174-179`、`.pi/extensions/consult/README.md:174`、`.pi/extensions/consult/run/log.ts:167-223`。

### Decision

- Status: **accepted**
- Main: 稼働中のサブエージェントの数が、エディタの上の 1 行で分かるようになる
  - Add:
    - consult は、エディタの上に稼働中の数を役割ごとに出す 1 行（`res:2 pro:1`）を出し、`types.json` の並び順に並べ、動いている役割だけに絞って 1 行に収める（C3, C4, F1, F2, F3）。
    - consult は、0 体になったら表示を消す（C3, F2）。
    - consult は、値を 5 秒ごとの tick と `session_start` の 2 か所でセットし直す（C2, C5, F2, F4）。
    - consult は、稼働の数をいまの session の記録（`run/log.ts` の `runningRuns`）から数え、リロードの前から動いているものも含める（C2, C6, C8, F7）。
  - Update:
    - なし。
  - Drop:
    - なし。
- Sub: 役割の短い名前が名前の先頭 3 文字に決まる
  - Add:
    - `research` は `res`、`review` は `rev`、`proofreader` は `pro`、`trial` は `tri`、`code` は `cod` になる（C4）。
  - Update:
    - なし。
  - Drop:
    - なし。
- Policy:
  - Allowed:
    - 表示には、`ctx.ui.setWidget` に文字列の配列を渡してよい（C1, F5, F6）。
    - consult は、表示の値を 5 秒ごとの tick と `session_start` でセットし直してよい（C5, F2）。
    - 先頭 3 文字が同じ役割は、同じ短い名で出してよい（C4）。
  - Forbidden:
    - consult は、表示の更新が失敗しても、サブエージェントの実行、音、完了報告を止めない - 表示は補助であり、実行の成否に関係しない（C7）。
    - consult は、テーマの色を含む文字列を保持しない - テーマを変えたときに古い色が残るため（F5）。

### Definition

- `Unit.subagent-consult`(kept): エージェントがサブエージェントのコンサルを実行し、そのワークツリーと結果を扱えるという主な機能は変わらず、変わるのは動いているサブエージェントの数が画面でも見えるようになる経路だけである。
- `Who.owner`(kept): 判断をする側であることは変わらず、画面に見える情報が 1 つ増えるだけのため。
- `Stack.Agent.Host`(kept): consult は pi の `setWidget` を使うが、パッケージとバージョンは変わらないため。
- `What`(kept): プロダクトが何であるかは変わらないため。

## 02: 同じ表示場所を他の拡張と共用するとき、表示をどう並べるか

### Scope

- In:
  - behaviour: consult は、自身の表示を他の拡張の表示と同じ場所（エディタの上）に同時に出す。
  - naming: consult のウィジェットのキーを、他の拡張と重ならない名前で決める。
- Out:
  - refactor: pi のウィジェットの仕組みは変えない（pi が持つ仕組みのため）。
  - format: 1 行の形はエントリ 01 で扱う。
  - prose: README の文面はエントリ 01 で扱う。
  - speed: 表示の順序を保証する仕組みは作らない（順序を定めた文書がないため）。
  - compatibility: 他の拡張のキーと表示は変えない（consult の側だけで決めるため）。
  - errors: 他の拡張の表示の失敗は扱わない（それぞれ独立しているため）。
  - security: 秘密情報、権限、露出は扱わない（扱う情報がないため）。
  - dependency: 新しいパッケージは入れない（必要がないため）。
  - deploy: 配布やリリースはしない（対象がないため）。
  - migration: 過去のウィジェットは移行しない（残すものがないため）。
  - logs and monitoring: 新しい記録や通知は増やさない（必要がないため）。

### Context

- C1: pi は、キーが違えばウィジェットを同じ場所に縦に積み、キーが同じなら後から書き込んだものが前のものを置き換える（前提）。
- C2: 積む順は Map に入れた順であり、キーの順や拡張の読み込み順との対応を定めた文書はない（前提）。
- C3: このリポジトリの拡張で、いま `setWidget` を使うものはない（前提）。
- C4: オーナーの要望は、他の拡張が同じ場所に出していても両方見えることであり、難しい場合には一時的に上書きして戻してよいことである（制約）。

### Research & Trial

- F1 (C1): Interactive はエディタの上と下で別々の Map を持ち、キーが違えば同じ場所に縦に積み、キーが同じなら後の書き込みで前のものを置き換える。出所: `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:329-330`、`:1853-1885`、`:1938-1952`。
- F2 (C1): 積む順は Map に入れた順であり、キーの順や拡張の読み込み順との対応を定めた文書はない。出所: `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1938-1952`（実装から読める範囲。文書の保証はない）。
- F3 (C1): このリポジトリの拡張で、いま `setWidget` を使うものはない。出所: `grep` の結果。

### Decision

- Status: **accepted**
- Main: consult の表示が、他の拡張の表示と同じ場所に消されずに並ぶようになる
  - Add:
    - consult は、固有のキー `consult-running` でウィジェットを出す（C1, C3, C4, F1, F3）。
  - Update:
    - なし。
  - Drop:
    - なし。
- Policy:
  - Allowed:
    - consult は、他の拡張と同じ場所に consult 固有のキーで出してよい（C1, F1）。
  - Forbidden:
    - consult は、他の拡張のキーを使わない - 同じキーでは後の書き込みが前の表示を消すため（F1）。
    - consult は、表示の順序を保証しない - 順序を定めた文書がないため（C2, F2）。

### Definition

- `Unit.subagent-consult`(kept): 主な機能は変わらず、変わるのは consult が他の拡張の表示と並べて出せるようになる経路（`consult-running` のキー）だけである。
- `Who.owner`(kept): 判断をする側であることは変わらず、consult の表示が他の拡張の表示と並んで見えるようになるだけのため。
- `Stack.Agent.Host`(kept): consult は pi のウィジェットの扱いを使うが、パッケージとバージョンは変わらないため。

## 03: 稼働状況が画面に見えるようになったとき、`/consult-status` をどうするか

### Scope

- In:
  - behaviour: `/consult-status` を残すか廃止するかを決め、廃止する場合には `consult_subagents` とウィジェットで足りるかを確かめる。
  - prose: `consult` の README の `Background and stopping` の表の行を、決めた形に直す。
  - compatibility: consult は、ウィジェットの表示（エントリ 01）と `/consult-status` の文面が食い違わないようにする。
- Out:
  - naming: コマンドの名前は変えない（残す場合はそのままにし、廃止する場合は消すだけであるため）。
  - refactor: `controlSubagent` の `list` と `consult_subagents` の実装は変えない（今回の変更と関係がないため）。
  - format: ウィジェットの 1 行の形はエントリ 01 で扱う。
  - speed: 作業時間や資源の上限は設けない（小さな変更のため）。
  - security: 秘密情報、権限、露出は扱わない（扱う情報がないため）。
  - errors: コマンドの失敗の扱いは変えない（既存の扱いを保つため）。
  - dependency: 新しいパッケージは入れない（必要がないため）。
  - deploy: 配布やリリースはしない（対象がないため）。
  - migration: 過去の記録は移行しない（残すものがないため）。
  - logs and monitoring: 新しい記録や通知は増やさない（必要がないため）。

### Context

- C1: いまの `/consult-status` はメモリの一覧を `ctx.ui.notify` で出し、読み直し後のインスタンスは空の一覧から始まる（前提）。
- C2: 同じ情報は `consult_subagents` でも見られ、こちらは記録を読むため読み直し後も使える（前提）。
- C3: `DEFINITION.md` に一覧を見る Unit はなく、`consult-status` の参照は `index.ts` と `README.md` の 2 つだけである（前提）。
- C4: オーナーは、ウィジェットの表示ができたら `/consult-status` を廃止すると決めた（オーナーの回答）。

### Research & Trial

- F1 (C1): `/consult-status` の実体は `commands.status` で、`controlSubagent` の `list` を呼び、メモリ内の `RuntimeState.subagents` を `ctx.ui.notify` で 1 つの通知として出す。1 行は `id`、役割、task の最初の行である。出所: `.pi/extensions/consult/index.ts:163-167`、`.pi/extensions/consult/tool/consult.ts:121-125`、`:146-161`、`:485-496`。
- F2 (C1): メモリの一覧は、サブエージェントが終わると `state.subagents.delete` で消える。Map は `createRuntime` の中で作られるため、読み直し後のインスタンスは空から始まる。出所: `.pi/extensions/consult/tool/consult.ts:339`、`:427`、`:467-476`。
- F3 (C2): 同じ情報はツール `consult_subagents` でも見られ、こちらは記録（ディスク）を読むため読み直し後も使える。1 行は `id`、`role`、`worktree` か `base`、状態、経過、`turns`、`spend` である。出所: `.pi/extensions/consult/index.ts:242-258`、`.pi/extensions/consult/tool/subagents.ts:132-151`、`:187-215`、`.pi/extensions/consult/run/log.ts:167-189`。
- F4 (C3): `DEFINITION.md` の `Users can do` には稼働中の一覧を見る Unit がなく、最も近い `subagent-consult` は実行することとワークツリーと結果を扱えることを書いている。出所: `DEFINITION.md:20-58`、`:50`。
- F5 (C3): `consult-status` の文字列は、`.pi/extensions/consult/index.ts:164` と `.pi/extensions/consult/README.md:182` の 2 か所だけにあり、スキル、テスト、`types.json` にはない。出所: `grep` の結果。
- F6 (C3): 廃止に伴って直すのは README の `Background and stopping` の 1 行だけであり、スキルの手順は `/consult-status` を前提にしておらず、テストも出力を検査していない。出所: `.pi/extensions/consult/README.md:172-185`、`grep` の結果。

### Decision

- Status: **accepted**
- Main: `/consult-status` がなくなる
  - Add:
    - なし。
  - Update:
    - なし。
  - Drop:
    - `/consult-status` の登録と README の `Background and stopping` の表の行を消す（C1, C2, C4, F1, F5, F6）。
- Policy:
  - Allowed:
    - 稼働の数はウィジェットで見て、一覧はエージェントが `consult_subagents` で見て、停止は `/consult-cancel` で扱う（C2, C4, F3）。
    - consult は、`DEFINITION.md` の Unit を動かさない（C3, F4）。
  - Forbidden:
    - consult は、メモリの一覧だけを出す仕組みを新しく増やさない - 読み直し後に空になるため（C1, F2）。

### Definition

- `Unit.subagent-consult`(kept): 主な機能は変わらず、変わるのは稼働の一覧を見る経路（`/consult-status` を消し、`consult_subagents` とウィジェットにする）だけである。
- `Who.owner`(kept): 判断をする側であることは変わらず、稼働の数を見る経路がウィジェットを使ったものに変わるだけのため。
