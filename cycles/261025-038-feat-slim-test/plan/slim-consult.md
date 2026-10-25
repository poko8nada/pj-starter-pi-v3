# PLAN `slim-consult`

- No: 01

## Files

```text
.pi/
  extensions/
    consult/
      index.test.ts            update
      policy/
        types.test.ts          update
      run/
        delivery.test.ts       update
        log.test.ts            update
        place.test.ts          update
        proc.test.ts           update
        subagent.test.ts       update
        worktree.test.ts       update
      sub/
        budget.test.ts         update
        guard.test.ts          update
        spec.test.ts           update
      tool/
        commit.test.ts         update
        consult.test.ts        update
        render.test.ts         update
        run.test.ts            update
        sound.test.ts          update
        subagents.test.ts      update
        worktree.test.ts       update
test/
  consult-fixture.ts           add
```

## Slices

## 1.役割と仕様

### Types

なし

### Steps

1. `test/consult-fixture.ts`:
   - `types.json` の 1 つの type、サブエージェントの依頼、記録の 1 行を工場で作る。期待値は工場に渡した値から取る。
   - 値と文字列を組み立てるだけで、プロセスも FS も開かない。テストの外から読まれても、何も起きずに止まらない。
2. `.pi/extensions/consult/policy/types.test.ts`:
   - (happy) 正しい設定 → 渡した名前の type がその順で引ける（名前は工場に渡した値から取る）。
   - (empty) `models` が空 → 通る。期待値は工場の値から。
   - (error) JSON が壊れている → 投げる。
   - (error) `tools` が空 → 投げる。
   - (happy) ホストの編集道具（`quick_edit` / `target_edit`）も名前として通る。
   - (error) 未知のツール名 → 投げる。
   - (empty) `paths` / `bash` が空 → 通る。
   - (error) `limits` が無い / `turns` が 0 以下 / `output` が 0 以下 → 投げる。
   - (happy) `limits` が正の値 → そのまま通る（数は工場の値から）。
   - (error) `limits` の `turns` / `output` のキーが欠けている → 投げる。
   - (happy) 設定を読み直す → 次の呼び出しに効く。
   - (error) `types.json` が無い / 権限で読めない → 理由の文面つきで投げる。
   - (error) 未知の type → 投げる。
   - (happy) 名前で引ける。
   - 落とす: 「`role` が無い → 通る」（任意の欄は型が保証する）。
   - 落とす: 「`isolated: true` を素通しする」（真偽値は型が保証する）。
   - 落とす: 「文面は例を写せと言わない」（否定の文面で、変わっても誰も気づかない）。
3. `.pi/extensions/consult/sub/budget.test.ts`:
   - (boundary) 上限 40 → 38 番、上限 2 → 0 番。
   - (error) 上限が不正 → 何もしない。
   - (happy) 数値の文字列はその数、空と非数は `undefined`。
   - (happy) 促しの番号で 1 度だけ促す。
   - (empty) 1 つ手前 / 上限不明 → 何もしない。
   - (happy) 一度出したら出さない。
   - (error) 促さない番号では `sent` を消費しない（37 の後に 38 が来たら促す）。
   - (happy) 登録した命令から `env` を読む。
   - 落とす: 「`env` 40 は 38 で促す」（上限 40 のケースと同じ仕様）。
   - 落とす: 「37 では促さない」（1 つ手前のケースと同じ仕様）。
4. `.pi/extensions/consult/sub/guard.test.ts`:
   - 秘密の判定は、入力と期待する真偽を組にした表にし、断言は表の値から取る。
   - (happy) 絶対パスの `.env`、深い場所の `.envrc`、相対パスを cwd で解決、symlink の先の `.env` → 秘密。
   - (error) `README`、`.ENV`（大文字）、`foo.env`（前方一致の境目）、`id.key.bak` → 秘密でない。
   - (error) `.env.bak` は定義名でない → 秘密でない。
   - (empty) 空文字 → 秘密でない。
   - (happy) 存在しないパスでも秘密の名前なら止める。
   - (happy) `node_modules` の中は広げない。
   - (happy) 読む道具と `.env` / `.envrc` / `.pem` を拒む。
   - (happy) `bash` と `cat` で `.env` を拒む。
   - (error) コマンド名だけでは止めない。
   - (error) 組み立てたパス、symlink、`$HOME` / 変数 / backtick / コマンド置換 / 既定値展開 / ANSI 引用符 / `$?` の展開後の `.env` を拒む。
   - (happy) `$PATH` は通す。
   - (empty) コマンド内の代入は見ない（既知の穴）。
   - (empty) 空のパス、引数が空 → 通す。
   - (happy) 許可の一覧が空 → どこでも書ける。
   - (happy) 許可の範囲（ファイルと下の全部、glob、外に出るパス）と語一致の接頭辞。
   - (error) 許可の一覧が壊れている → 書く道具と `bash` を止める。
   - 落とす: 「`foo.env` の前方一致しない」「`.env.bak` は定義名でない」の独立した 2 本（上の表に畳む）。
5. `.pi/extensions/consult/sub/spec.test.ts`:
   - 期待する argv は工場に渡した役割とモデルから組む。
   - (happy) guard を tools の後ろに渡し、guard のパスは絶対で非空。
   - (happy) guard と budget を 2 回渡す。
   - (empty) `tools` が空でも位置が変わらない。
   - (happy) 機械に依らない形、ヘッドレスの 1 回の形、既定で no-approve。
   - (happy) model は候補の 1 番目、候補が空なら付けない。
   - (happy) type のツールと役割の追記を渡す。役割が空なら追記しない。
   - (error) `task` は argv に載らない。
   - (happy) `isolated` が真なら隔離する。
   - (happy) 出力の各行をイベントにし、JSON でない行は捨てる。
   - (happy) 最後の assistant の文を返し、複数の text を連結する。
   - (empty) tool call 以外は無視し、user は拾わず、空なら空文字。
   - (happy) provider と model を組み立て、usage の消費を合計する。
   - (error) 生成が無い / `errorMessage` → 真偽と文面。
   - (happy) type ごとの上限が効き、超えたら理由を返す。
   - (boundary) ちょうど許し、1 超えで止める。
   - (happy) session のパスがある形、token と session の両立、`no-session` の子の token。
   - (empty) 最後が空なら前の文を返す。
   - 落とす: 「`-p` の後に name と token」（`-p` の形のケースと同じ仕様）。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## 2.記録と走行

### Types

なし

### Steps

1. `.pi/extensions/consult/run/log.test.ts`:
   - 記録の行は工場で作る。期待値は工場に渡した値から取る。
   - (happy) 1 行足して読み、2 回足すと 2 行。
   - (happy) 書いて読み直すと `token` と `startToken` が往復し、本体の欄を上書きしない。
   - (error) 数値の `token` / `startToken` は読まずに捨てる。
   - (empty) 置き場が無い → 空。
   - (error) 壊れた行 / 形の違う行は飛ばす。
   - (happy) 始まった順に返し、終わりの欄はそのまま返す。
   - (happy) 日をまたぐと別の file に 1 行ずつ。`at` が無ければ今日の file。
   - (happy) session で絞る。
   - (happy) 自分の pid は生きていて、不可の pid と 0 以下は死んだ扱い。
   - (happy) 終わりの行が無ければ生きている。
   - (happy) token 付きの running / ended / unknown の扱いと、token が無い行の移行。
   - (happy) ended があれば短絡で偽。
   - (happy) token 付きは lstart を見て、token が無ければ `pidAlive`。
   - (happy) 開始と終了があれば非走行。
   - (empty) 行が無ければ空。
   - (error) token が不一致なら error の行を足し、合致すれば増えない。
   - (error) 古い行が死んでいれば終了の行を書く。
   - (empty) 行が無い / 終了の行がある → 書かない。
   - (error) 権限で読めない → 投げる。
   - (error) unknown は書かない。
   - (happy) 生存は閉じない。
   - (happy) 印ありの集合、印無しの完了、session と subagent と started の違いで別の鍵。
   - (happy) 文字の `delivered` は落とす。
   - (error) notice の無い終わりは偽。
   - 落とす: 「token 付き running は真」「token 付き ended は偽」「開始のみ token 合致は走行」「開始のみ不一致は非走行」「unknown は走行側」の 5 本（上の token の束と同じ仕様）。
   - 落とす: 「status null は unknown」（80 と同じ仕様）。
2. `.pi/extensions/consult/run/delivery.test.ts`:
   - (empty) 欄が無ければ `undefined`。
   - (error) 壊れた JSON は `undefined`。
   - (happy) 印の無い完了を返す。期待値は工場の値から。
   - (happy) `appendDelivered` の後は返さない。
   - (boundary) 古い目録の水位。
   - (empty) 行 0 本 → 空。
   - (happy) 2 行は古い順。
   - (happy) 別の session は絞る。
   - (error) 開始の行と notice の無い行は返さない。
   - (happy) 古い欄を消し、新しい欄を残す。
3. `.pi/extensions/consult/run/place.test.ts`:
   - (happy) 別の道の同名の repo は別の値。ローカルの日で組む。
   - (empty) 置き場が無ければ空。
   - (happy) 今日と昨日を新しい順に。`delivered.json` は拾わない。その日の file を指す。
   - (boundary) 30 日の境目は残す。
4. `.pi/extensions/consult/run/proc.test.ts`:
   - (happy) lstart が一致すれば running、違えば ended。
   - (error) pid が無い → ended。
   - (error) stderr あり / status が 1 で出力あり / status が 2 → unknown。
   - (boundary) 部分一致は通らない。
   - (happy) `ps` の引数の形、前後の空白を落とす。
   - (error) 不正な pid では `ps` を叩かない。
   - (error) startToken が空 → unknown。
   - (empty) exit 1 で出力なし → `undefined`。
   - (error) stderr あり → `undefined`。
   - 落とす: 「status null は unknown」（status 2 のケースと同じ仕様）。
   - 落とす: 「28 桁詰めの空白も一致」（前後の空白を落とすケースと同じ仕様）。
5. `.pi/extensions/consult/run/subagent.test.ts`:
   - 期待する argv は工場の依頼から組む。
   - (happy) 隔離しない役割はベース、非隔離に worktree を渡せる。
   - (happy) 隔離する役割は worktree が要り、無ければ投げる。
   - (happy) 上限と許可だけを載せる。
   - (happy) job の token が argv に届く。
   - (happy) worktree ごとに 1 つの会話。
   - 落とす: 「上限 40 は 40」（上限を載せるケースと同じ仕様）。
6. `.pi/extensions/consult/run/worktree.test.ts`:
   - 期待する枝名と道は `branchFor` と工場の値から取る。
   - (happy) 作った後も root は同じ。worktree が無ければ `undefined`、あれば使う。
   - (happy) 2 回呼んでも作るのは 1 回。無ければ新しく作る。
   - (happy) unit の worktree を作り、2 回呼んでも増えない。
   - (happy) base を指定でき、既定は HEAD。
   - (error) `add` が失敗したら例外で残さない。
   - (happy) 実体のある登録は一覧に出て、実体の無い登録は出ない。囮は除き、実体だけを選ぶ。
   - (error) git が拒否したら空の一覧。
   - (empty) 作業場が無ければ空。
   - (happy) 変更が残れば dirty、残らなければ git から作る。
   - (happy) 作って消すと removed。
   - (error) 動作中は busy で断る。変更が残っても断る。
   - (happy) dirty でも孤児の枝は掃除し、force なら消える。
   - (happy) 未マージの枝は残し、ゴーストは prune で消え、force なら捨てる。
   - (happy) 消すのは unit だけ。
   - (error) remove が失敗したら例外。
   - (happy) 統合の片付けと、2 回目の掃除は空。
   - (error) 走行中は消さない。git が拒否したら例外。`for-each-ref` の失敗も例外。
   - (happy) 置き場は外を指す。
   - 落とす: 「作業場の無い id は missing」（作って消したケースと同じ仕様）。
   - 落とす: 「空の id は missing」は残す。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## 3.道具の面

### Types

なし

### Steps

1. `.pi/extensions/consult/tool/sound.test.ts`:
   - (happy) `playSound` → 差し替えた player が 1 回呼ばれる。
   - (error) `enabled` が off → 鳴らさない。
   - (happy) 鳴らす所を差し替えると、渡した物だけが呼ばれ、元に戻る。
2. `.pi/extensions/consult/tool/run.test.ts`:
   - 依頼は工場で作る。
   - (happy) role と task だけ → worktree も continue も無い依頼。
   - (happy) worktree と continue を渡せる。
   - (error) `continue: false` も渡せる。
   - (error) role が無い / task が空 / worktree が空文字 → 使い方つきで投げる。
   - (error) `continue` が真偽値でない → 既定に落ちる。
   - (error) オブジェクトでない値 → 使い方つきで投げる（モデル由来の JSON を受ける）。
   - (error) 面に無い鍵（`input`）は無視する。
3. `.pi/extensions/consult/tool/commit.test.ts`:
   - (happy) 変更のある worktree → committed と、そのハッシュが HEAD。
   - (empty) 変更が無い → no change。
   - (error) フックが拒む → rejected と出力。add した分は残す。
   - (happy) メッセージは `commitMessage` から取る。
   - (happy) 3 つの結果をそれぞれ 1 行にする。
   - (happy) worktree だけを受ける。
   - (error) worktree が無い / 空 → 使い方つきで投げる。
   - 落とす: 「同じ worktree で 2 回目 → no change」（1 回目のケースと同じ仕様）。
   - (error) 面に無い鍵（`message`）は無視する（引数でメッセージを渡す道は作らない）。
4. `.pi/extensions/consult/tool/render.test.ts`:
   - 塊の文は `usageLine` に渡す値から組む。外から形が与えられていない JSON を推測で作らない。
   - (error) モデルが分からなければ `unknown` と出す（空にしない）。
   - (happy) 回数と入出力を 1 行にする。
   - (happy) id を出し、無ければ `consult` とだけ書く。
   - (happy) 素性・場所・回数・量・触った物を出す。
   - (happy) worktree のサブエージェントはその id を場所に出す。
   - (happy) 触ったファイルを並べる。
   - (error) done でなければ理由の行を出す。done なら出さない。
   - (error) diff を運ばない。
   - (happy) cost があれば末尾に `$` で出す。
5. `.pi/extensions/consult/tool/subagents.test.ts`:
   - 記録の行は工場で作る。期待する文は工場の値から組む。
   - (happy) 60 秒までは秒、超えたら分と秒。終わったものは終わりまでの時間。
   - (happy) id / role / 場所 / 状態 / 経過 / ターン / 費用を 1 行に並べる。
   - (empty) worktree の無いものは base と出す。
   - (error) 終わったものは state と reason を出し、走っているものは出さない。
   - (error) 終わりの行が無く check が ended → lost。
   - (error) 終了の行があるものを running にしない。
   - (happy) 走っている開始の行 → running と pid。
   - (empty) 印の無い完了の行 → running で pid を出さない。印のある完了の行 → done。
   - (empty) 記録が空 → 空の一覧と、無い旨の文。
   - (happy) サブエージェントごとに 1 本に畳み、終わりの行があれば順序に依らずそれを採る。
   - (empty) 記録が空 → 空のまま。
   - (happy) `{action: list}` → 記録の行。action を省くと list。
   - (happy) list の check の口が効く。
   - (happy) 2 つの session → いまの session だけ。
   - (empty) 3 日前に始まっていまも走っているもの → 一覧に出ない。
   - (happy) 3 日前に始まって今日終わったもの → state 付きで出る。
   - (happy) `{action: cancel, id}` → 止めた結果。id が無ければ使い方つきで投げる。
   - (error) 知らない action → 投げる。
   - 落とす: 「終わったサブエージェントは終わりまでの時間」（60 秒のケースと同じ仕様）。
   - 落とす: 「終わりの行があるものを running にしない」（state と reason のケースと同じ仕様）。
   - 落とす: 「逆順の終了行 → done」（畳みのケースと同じ仕様）。
   - 落とす: 「`USAGE` は接頭辞で始まる」（定数自身の写し）。
6. `.pi/extensions/consult/tool/worktree.test.ts`:
   - 期待する枝名と道は `branchFor` と工場の値から取る。
   - (happy) new → id / branch / path / base を返す。
   - (error) id が無ければエラー。
   - (empty) list → 作った物を出し、1 つも無ければその旨。
   - (error) 変更の残る worktree → list に changed、remove は dirty で断る。
   - (error) `worktree remove` の失敗、`for-each-ref` の失敗 → 投げる。
   - (error) 走っている unit の remove は busy。記録の pid が死んでいれば消える。
   - (error) 終わった記録だけなら消える。別の session の走っているものでも busy。
   - (happy) list が走っている unit に印を付ける。
   - (error) start と end のある unit は busy でない。
   - (error) 開始行だけで check が running → busy、ended → busy でない、unknown → busy。
   - (error) 知らない action → エラー。
   - (happy) 消した物・掃除した登録・残した枝を言う。無い登録でも掃除した物と残した枝を言う。
7. `.pi/extensions/consult/tool/consult.test.ts`:
   - 記録は工場で作る。期待する番号と文は工場の値から組む。
   - (happy) review を 1 体起こす → id が返り、その時点では終わっていない。
   - (happy) 記録に `consult-3` → 次は `consult-4`（reload で戻らない）。
   - (error) 別の session の `consult-9` は数えない。
   - (happy) 同じ runtime で続けて 2 体 → 記録に書く前に次を決める。
   - (error) 書き込む役割で worktree を省くと、起こさずに拒む。
   - (error) 知らない worktree の id → 起こさずに拒む。
   - (happy) 完了 → `pi.sendMessage` は呼ばれず、記録に本文と token の 1 行。
   - (error) runner が投げる → 記録に 1 行、notice に失敗の本文。
   - (happy) `/consult-cancel <id>` → その id が止まる。知らない id は理由を出して止めない。
   - (happy) 掴んでいるもの → abort で止まり、kill は呼ばない。
   - (happy) 掴んでいないもの（記録だけ、pid 生存）→ kill を 1 回。
   - (error) pid が死んでいる / 終わった / 記録に無い / 別の session → kill を呼ばず理由を返す。
   - (happy) 開始の行だけ（startToken 付き）→ check に従う。unknown は走っている側。
   - (happy) `/consult-sound` → 状態を出し、on / off を切り替える。
   - (empty) サブエージェントが 0 体ならそう言う（空文字を返さない）。
   - (happy) 知らせの文はどの分岐でも接頭辞で始まる。
   - (error) `/consult-cancel` に id が無ければ使い方を出す。
   - (error) `/consult-sound` に不正な引数 → 使い方を出す。
   - (happy) `onStarted` の開始行 → `startToken` が `readStartToken` の値と一致する。
   - (error) `onStarted` で ps が読めない → `startToken` 無しの開始行。
   - (happy) 完了の行は開始行と同じ token を持つ。
   - (happy) 記録に `consult-7` と `consult-2` が混ざる → 次の番号は最大 +1 の `consult-8`（最終行 +1 ではない）。
   - (happy) 終わった記録の番号も数える → 次は `consult-6`。
   - 落とす: 「start と end のある subagent → kill しない」（終わったもののケースと同じ仕様）。
   - 落とす: 「`/consult-status` が 0 体ならそう言う」（0 体のケースと同じ仕様）。
   - 落とす: 「完了の行は token を持つ」（UUID の形は生成が保証する）。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## 4.配線

### Types

なし

### Steps

1. `.pi/extensions/consult/index.test.ts`:
   - 通知の文は工場の件数から組む。
   - (empty) 印の無い完了は 0 件 → 0 を返す。
   - (happy) tick で送り、印を 1 本、音を 1 回。
   - (error) 走っている開始の行は送らない。
   - (empty) 何も無いときは送らず鳴らさない。
   - (happy) 音が off でも送る。
   - (error) 送信に失敗したら印を進めない。
   - (happy) `startTick` を 2 回でも 1 本。
   - (error) `stopTick` の後は送らない。
   - (happy) 古い完了は新しい tick が渡す。
   - (happy) 同じ印で running から done へ。
   - (happy) 印の無い完了を 1 件渡す。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## Notes

### Slice 1: 役割と仕様

- Findings: なし
- Unplanned: なし
- Commit: af6a591
- Stopped:

### Slice 2: 記録と走行

- Findings: なし
- Unplanned: なし
- Commit: 9676e66
- Stopped:

### Slice 3: 道具の面

- Findings: なし
- Unplanned: なし
- Commit: bf5e8e0
- Stopped:

### Slice 4: 配線

- Findings: なし
- Unplanned: なし
- Commit: fb08009
- Stopped:

### Cleanup: token の重複断言

- Findings: なし
- Unplanned: `tool/consult.test.ts` の token 双方向断言の重複 1 本を落とした。同じ振る舞いを 2 方向から試していた。

## Review

### Plan review

- `:50` の「4 つの type が引ける」は、コミット済みの `types.json` の名前を写しており、type を足しただけで赤になります。
  - fixed: 「渡した名前の type がその順で引ける（名前は工場に渡した値から取る）」に直した。
- `:88` の `file_path` だけは通すは、pi が渡す鍵が `path` だけなので、起こり得ない入力の通過を固定していました。
  - fixed: 落とし、既知の穴として「コマンド内の代入は見ない」だけを残した。
- `policy/types.test.ts:145-164` の、正の `limits` とキー欠けの 2 件を運ぶ step がありませんでした。
  - fixed: `(happy)` と `(error)` の 2 ケースを足した。
- `sub/budget.test.ts:101-113` の、促さない番号が `sent` を消費しないことが、どの step にもありませんでした。
  - fixed: 「37 の後に 38 が来たら促す」を足した。
- `run/log.test.ts:365` `:387-443` の保存形式の往復が、どの step にもありませんでした。
  - fixed: `token` と `startToken` の往復、本体の欄を上書きしない、数値は捨てる、の 2 ケースを足した。
- `tool/consult.test.ts:164` を落とすと、最大ではなく最終行を見る退行が緑のままでした。
  - fixed: 「混ざる記録 → 最大 +1」のケースを戻した。
- `tool/consult.test.ts:199` を落とすと、終わった記録を数えない退行が緑のままでした。
  - fixed: 「終わった記録の番号も数える」を戻した。
- `tool/run.test.ts:43-50` を落とすと、モデル由来の JSON の形を確かめる規則が消えます（型は実行時の値を通しません）。
  - fixed: 2 ケースを戻した。
- `tool/commit.test.ts:95-97` を落とすと、メッセージを引数で渡さない規則が消えます。
  - fixed: `message` を無視するケースを戻した。

### Round 1

- Stale:
  - `.pi/extensions/consult/run/proc.test.ts:104`: 試験名は「前後の空白を落とした文字列」と記しておりますが、入力が `${START}\n` のみとなり、前後の空白の除去を確かめておらず、名称が実態とずれて古くなっております。
    - fixed: 入力の先頭に空白を足し、前後両方の除去を確かめる形に直した。
- Unlisted:
  - なし — 差分の試験文書は `Files` に挙げられた範囲に収まり、`plan` 自体の `Notes` 追記は運用上の記録のため数えておりません。
- Gaps:
  - `.pi/extensions/consult/run/proc.test.ts:104`: `readStartToken` の前後空白除去の振る舞いが、残された検査では末尾改行のみで確かめられており、先頭側の空白を含む入力での除去が検査されておりません（落とされた 28 桁詰めの事例と同一仕様のため、残る側での担保が必要でございます）。
    - fixed: 入力の先頭に空白を足し、落とした 28 桁詰めと同じ仕様を残る側で担保した。
- Unproven:
  - `.pi/extensions/consult/policy/types.test.ts:99`: 期待値に製品定数 `CONFIG_FILE` を用いており、当該定数が壊れても同じ値同士の比較となり緑のままとなります。
    - fixed: テストが作った道の名前で比べる形に直した。
  - `.pi/extensions/consult/sub/spec.test.ts:215`: 期待値に製品関数 `usageFrom` 自身の出力を用いており（`single` の倍加）、当該関数が壊れても両辺が同じく壊れるため緑のままとなります。
    - fixed: 入力の usage の値から直接期待を組む形に直した。
- Noise:
  - `.pi/extensions/consult/sub/spec.test.ts:195`: 試験補助 `messageEnd` の既定値自体を断言しており、製品の振る舞いではなく試験道具の写しを確かめるもので、どなたも気づかれない書き方となっております。
    - fixed: 補助の既定値を確かめる断言を落とした。
- Doubts:
  - `Files` に `update` と記された `.pi/extensions/consult/run/place.test.ts` と `.pi/extensions/consult/tool/sound.test.ts` に差分がございません。既に痩せた状態のため変更不要とお見受けしますが、念のため申し添えます。
  - `branchFor` および `commitMessage` を期待値に用いる箇所は、計画書の `Steps` にて明示的に指示されておりますため、所見から除いております。

## Acceptance

- Ran:
- Findings:
- Doubts:
