# ADR 033

## 01: コンサルの結果の届き方と「終わった」の判定を、記録の 1 本の通り道に揃えるか

### Context

- 走行中にリロードが挟まると、子が終わった時の結果は `notice` 行として記録に残る (`.pi/extensions/consult/run/delivery.ts:156-161`)。
- `notice` 行を読むのは `deliverUnread` だけで、呼ばれるのは `session_start` の時だけ (`.pi/extensions/consult/index.ts:171`)。次のリロードか新しいセッションまで、結果は届かない。
- ステータスと音はプロセスの生死で決まる (`.pi/extensions/consult/run/log.ts:98-100`、`.pi/extensions/consult/tool/sound.ts:72-78`)。結果の受け渡しより先に「終わった」になる。
- 実記録では、同じ完了が「終わった」行と `notice` 行の 2 行に書かれている (`/tmp/pi-consult/records/_pj-starter-pi-v3-5a13ebdd/2026-10-22.jsonl:135-136`)。`notice` 行は 3 本ある (`:91, :136, :139`)。
- owner の求めは 2 つ。結果がリロードを待たずに届くこと。一覧・音・結果が同じ「終わった / まだ」を指すこと。
- 分かっていないこと: 無し。

### Decision

- Status: **accepted**
- Adopted:
  - 記録だけを通り道にする（A）。完了は必ず記録の 1 行（本文と、走行を指す値）にする。セッションが記録を定期的に読み直し、印の無い行を `pi.sendMessage` で渡して、その行に印を書く。一覧と音は、印の無い行の有無で「まだ / 終わった」を決める。
- Options:
  - B: 直接の通り道を残す（理由: 直接の経路が失敗した時に記録に何も残らず、一覧が「終わった」と言い切る。通り道が 2 本になり、同じ食い違いが戻る余地を残す）
  - C: A に加えて、印を本文がセッションに入った時に書く（理由: `followUp` で積んだ本文に `message_start` が出るかを確かめていない。長いターンの間ずっと音が鳴る）

### Scope

- 変更:
  - in: behaviour。完了を記録の 1 行にし、セッションが記録を定期的に読み直して、印の無い行を渡す。一覧と音は、印の無い行の有無で「まだ / 終わった」を決める。
  - in: format。走行ごとの「渡した」印を、記録と目録の自身の欄に足す。
  - in: prose。`README.md:184` の「次の boot で渡す」の記述を、新しい振る舞いに合わせる。
  - out for now: refactor（理由: 同じ判定は 3 か所に分かれたままで足りる見込み。再訪条件: 同じ判定を 3 か所に書くことになったら in）
  - out: dependency（理由: タイマーもファイル読みも既にある）
  - out for now: naming（理由: いまの語で足りる見込み。再訪条件: 一覧に「報告待ち」の状態の語を出す決定になったら in）
  - out for now: 親の pi のプロセスごと落ちた時に本文を残す（理由: 本文は親のメモリーにしかない。再訪条件: owner がプロセスの終了まで守りたいと言ったら in）
- 品質:
  - out: speed（理由: 5 秒の tick がすでに記録を読んでいる。測るほどの差が無い）
  - out: security（理由: 新しく読む物は、いまも読んでいる記録と目録だけ）
  - in: compatibility。直す前に書かれた `notice` 行と、古い形の目録を読めるようにする。
  - in: errors。タイマーの中の失敗を捕まえ、次の tick に任せる。音の tick を止めない。
- 運用:
  - out: deploy（理由: 配る手順が無い）
  - out for now: migration（理由: 古い形を読む側で吸収するので、変換する物が無い。再訪条件: 目録の意味を変える決定になったら in）
  - out: logs and monitoring（理由: 記録そのものが記録）

### Research & Trial

- 古い `pi` はリロードの直後に無効になり、`pi.sendMessage` は同期で throw する（`node_modules/@earendil-works/pi-coding-agent/dist/core/agent-session.js:2972-2973`、`node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/loader.js:302-305, 112-116`）。渡せるのは、新しいインスタンスの `pi` だけ。
- `session_start` の `ctx` に送信口は無く、送信口は `pi` にだけある（`node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts:213-253`）。
- タイマーは `session_start` で起こし、`session_shutdown` で止めるのが docs の指示（`node_modules/@earendil-works/pi-coding-agent/docs/extensions.md:58-60, 265-266`）。止め損ねると、古い `pi` を持つコールバックが同期で throw し、その失敗は `send_message` のエラー経路に乗らない。
- 子の標準出力は、起こしたインスタンスが持つ（`.pi/extensions/consult/run/run.ts:172-183, 437-451`）。新しいインスタンスは、記録を読む以外に完了を知る手が無い。
- 拡張イベント（`turn_end`、`agent_end` など, `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts:536-932`）は親のターンで出る。子の完了では出ない。
- `fs.watch` は一貫性を保証せず、`fs.watchFile` は既定 5007ms の stat ポーリングになる（https://nodejs.org/api/fs.html）。
- `followUp` に入った本文は、ターンの終わりに、ツール呼び出しが無く steering のメッセージも無い時に読まれる（依存パッケージ `@earendil-works/pi-agent-core` の `dist/agent-loop.js:186-198`）。
- 目録は 1 セッションに 1 値なので、走行ごとの到達は言えない（`.pi/extensions/consult/run/delivery.ts:34-37, 123-134`）。`deliverUnread` は started 順の最後の `ended` を書くため、終了順が前後すると二重配達になる（`.pi/extensions/consult/index.ts:71-85`、`.pi/extensions/consult/run/log.ts:185`）。実記録に前後する例が 3 組ある（`/tmp/pi-consult/records/_pj-starter-pi-v3-5a13ebdd/2026-10-22.jsonl:7-18, 77-84, 119-124`）。
- 走行を一意に指す値は、開始行の `token`（UUID）。終了行を作る `closeRecord` は `token` を写さない（`.pi/extensions/consult/tool/consult.ts:411, 322-343`）。
- 残りターンの促しは、子のプロセスの中で閉じる。結果の届き方は変えない（`.pi/extensions/consult/sub/budget.ts:67-79`）。

### Definition

- `Unit.subagent-consult`(kept): コンサルを走らせ、作業場と結果を扱う機能は変わらず、変わるのは結果が届く通り道と、「終わった」を決める印。
