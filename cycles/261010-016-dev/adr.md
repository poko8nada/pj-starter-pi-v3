# ADR 016

## 01: consult

### 01-1: .reload

1. Agenda:
   - Title: reload をまたいだ時に、終わった子の報告と、走っている物の後始末を誰が受け持つか
   - Proposal: 判断の材料を、拡張のインスタンスが覚えていることではなく、記録そのものにする。
     - 完了の報告: 起動のたびに記録を読み直し、まだ owner に渡していない完了の報告を渡す。渡した印は、追記のみの記録の外にある小さな目録 1 つに持つ。目録は置き場の下の 1 ファイルで、最後に配達した通知の終わりの時刻を書く。配達してから目録を進めるので、途中で落ちても失われない（同じ物を 2 回渡すことはある）。
     - 音: 5 秒ごとに記録を読み直し、走っている子が居なければ自分を止める。読む幅は一覧と同じにする。インスタンスの children を根拠にしない。
     - 止める: 一覧に出ている子は、そのインスタンスが起動した子でなくても止められるようにする。止める側は pid に SIGTERM を送るだけにする。記録は、その子を持っていた側の完了処理が書く。持っていた側が既に居なければ記録は書かれず、その子は行方不明として見える。
2. Highlight:
   - 子を 1 体走らせている間に、owner が pi を reload した。pi のプロセス番号は 45862 のままで、子（consult-2、code、pid 51894）は生き続け、180 秒後に正常に終わった。worktree には `Sat Oct 10 15:28:27 JST 2026` が書かれ、一覧にも reload の後に `running (pid 51894)` と正しく出た。終わりの行も記録に書かれた。**それでも owner には完了の報告が届かず、記録に notice の行が 1 本増えただけだった。**
   - reload はプロセスを入れ替えない。入れ替わるのは拡張の runtime だけである（docs/extensions.md:50）。だから子は死なない。
   - 報告が届かない道筋はこうである。reload が session_shutdown を呼び、そこで届け先を手放す（index.ts:116-119）。子が終わると、それを待っていたのは古いインスタンスであり、届け先が無いので notice として記録に書き足す（run/delivery.ts:46-53）。ところが notice を読む者が居ない。起動の時に走る announceRunningChildren は、走っている子だけを見る（index.ts:23-33）。
   - 音も同じ根から漏れる。reload の後の session_start が announceRunningChildren を呼び、startSound() でタイマーが新しいインスタンスに立つ。タイマーを止める stopSound() を呼ぶのは完了の処理だけだが（consult.ts:291-293）、その完了は古いインスタンスに届く。古いインスタンスのタイマーは session_shutdown ですでに消えているので、新しいタイマーを消す者が誰も居ない。新しいインスタンスは子を持たないため、子が 0 体になる条件が永久に来ない。
   - 実際に、reload の後も afplay が 5 秒ごとに生まれ続けた（57074、57173、57265。親は pi の 45862）。`/consult-sound off` は enabled を false にするだけで、ループは止まらなかった。owner が pi を終了させるまで鳴り続けた。
   - 止める手も失われる。cancel は state.children から子を引くので（consult.ts:389）、reload の前の子は AbortController が残っておらず（consult.ts:321）、一覧に出ているのに止められない。
   - enabled もモジュールの変数なので reload で true に戻る。ただし sound.ts:6 が「セッションの間だけ効く」と書いているので、これは設計どおりとして触らない。漏れているのはタイマーであって、設定ではない。
   - index.ts:18-22 と log.ts:4-6 には「子は親のプロセスに従属しない」と書いてある。これは reload については正しいが、プロセスの死については誤りである。親を落とすと子も死ぬ。pipe が親に繋がったままになるためで、対照実験では pipe の子は死に、file の子は生き残った。根拠が混ざっているので、コメントを分けて書き直す。
   - 配達済みの印を記録の中に足す案は捨てた。記録は追記のみで、latest() は child id だけを鍵にする（children.ts:78-84）。欄が増えると勝者が変わるので、印は記録の外に置く。
   - 落とした案: 完了を握っている promise を新しいインスタンスへ渡す（runtime の差し替えで古い closure には届かない）／通知で owner に知らせるだけ（対処療法だとして owner が却下）／stdio を file にして子を親の死から守る（プロセスの死の話になり、このエントリの外になる）
3. Research: mechanism
   - reload は拡張の runtime を入れ替える（docs/extensions.md:50）。後片付けが同じ道に集まる物として、cancellation、reload、session replacement、process exit が別々に並んでいる（docs/extensions.md:263）。reload は process exit ではない。
   - 起動の時に 1 回走るのが announceRunningChildren で、記録から走っている子を数えて音を鳴らし始める（index.ts:23-33、index.ts:58-66）。
   - 子は beginRun で AbortController と一緒に state.children に入り、1 体目で startSound() が呼ばれる（consult.ts:321、342-344）。完了の処理は、子が 0 体になった時だけ stopSound() を呼ぶ（consult.ts:291-293）。
   - 届け先が無い時の通知は、notice として記録に追記される（run/delivery.ts:46-53）。
   - 記録は追記のみで（log.ts:52-55）、latest() は child id を鍵にする（children.ts:78-84）。
   - 止められる子は、いまはそのインスタンスが起動した子だけである。AbortController はこのプロセスの物しか無い（children.ts:7-8、consult.ts:85-93、321）。
4. Trial: reload をまたぐ子の生存、報告の到達、音の漏れ、プロセスの死との比較
   - 子を 1 体走らせ（code、worktree 016-reload-trial、sleep 180）、その間に owner が `/reload` を打った。pi の pid は 45862 のままで、子は生き続けて正常に終わり、一覧にも正しく出た。
   - **完了の報告は届かず、記録に notice が 1 本増えた。** 誰も読まないまま残っている。
   - 音は reload の後も 5 秒ごとに鳴り続けた（12 秒のサンプリングで afplay を 3 回捕まえた）。`/consult-sound off` ではループは止まらず、pi の終了で消えた。
   - プロセスの死との比較: 親を 1 秒で落として 7 秒後に見た所、pipe の子は死に、file の子は生き残った。reload では子は死なないので、この 2 つは別の話である。
   - 未実施: 未読の notice を起動の時に owner へ渡すこと、reload と同時に終わる子（同じ物を 2 回渡さないか、1 回も渡さない物が出ないか）、pid に SIGTERM を送って止めること（止めた後の記録が誰の手で書かれるか）。
5. Decision: **accepted**

### 01-2: .children

1. Agenda:
   - Title: 一覧が読む記録を、どこに置き、どこまで読むか
   - Proposal: 記録の置き場を、リポジトリから決まる固定の場所にする。
     - 場所: `<CONSULT_ROOT>/records/<project>/<YYYY-MM-DD>.jsonl`。`<project>` は `git rev-parse --show-toplevel` が返す実体パスから作り、名前はその最後の成分、衝突を避けるために道の sha1 の先頭 8 文字を付ける。道はリポジトリから決まる関数なので、記憶を持たず、reload をまたいでも同じ物になる。
     - 日割り: 行を書いた瞬間の日で決める。時刻はプロセスのローカルを使う。日をまたいで走る子は、開始の行が前の日のファイルに、終わりの行が今日のファイルに入る。
     - 読む幅: 今日と昨日の 2 ファイル。音の読み直しも同じ読みを使い、一覧と音が同じ物を見るようにする。
     - 表示: 一覧に出すのは「走っている子」と「いまのセッションが起動した子」だけに絞る。
     - 行方不明: 終わりの行が無く pid も死んでいる子は `lost` と表示する。done と偽らない。
     - 掃除: 起動のたびに、30 日より古いファイルを消す。
     - 移行: しない。`<unitDir>/log.jsonl` は読まない。01-3 の汚染も一緒に捨てる。
     - rootFor: 作業場と会話のために残し、1 回決めて覚え、読む経路では作らない。
2. Highlight:
   - 症状は owner の言葉で「知らない間にまだ走ってる」「リスト上はいない」である。
   - 一覧を 1 回呼んだだけで、空のフォルダが 29 個から 30 個に増えた（58 個のうち 31 個が空だった）。consult-7 の開始の行は `...155017` に、終わりの行は `...155018` に分かれて書かれた。原因は rootFor で、consult の worktree が 1 つも無い時に、呼ばれるたびに現在の時刻で新しいフォルダを作る（worktree.ts:125-137）。読むだけの経路でも作るので、置き場が呼ぶたびに変わる。
   - worktree が 1 つでもあれば rootFor はそれを使うので安定する（reload の実験では一覧が正しく出た）。壊れるのは、consult の worktree が 1 つも無い時である。マージの後に worktree を片付けた直後がそれに当たる。
   - 記録は消える所にある。removeWorktree は unitDir を丸ごと消し（worktree.ts:370）、記録はその中の log.jsonl にある（log.ts:47-49）。worktree を片付けると記録も消える。この実験の証拠も同じ道で消える。
   - 表示も嘘をつく。rowOf は、走っていない子を `record.state ?? 'done'` と表示する。開始の行だけで pid が死んでいると done になる（children.ts:87-101）。
   - 量は 3 日分で 108 行、13.7 KB だった。1 日あたり 36 行で、1 行は約 129 バイトである。
   - 最初の規則は「今日と昨日」、次に「2 日より長く走る子が消える」を理由に 7 日、最後に「7 日は大きすぎる」として今日と昨日に戻った。**2 日より長く走っている子は窓の外に出て、一覧からも音からも消える。これは受け入れる限界とする。**長く走る子を拾う仕掛けは、必要になったら別のエントリで扱う。掃除で古いファイルが消えることも、同じ限界に含まれる。
   - owner の判断: 上限が要る。読むのは決めた幅までにして、30 日より古いファイルは起動のたびに消す。
   - 落とした案: 全部の runRoot を合わせて読む（removeWorktree の削除と矛盾する）／記録に session の欄を足す（古い行に無いので後方互換が要るとして落とした。01-4 が覆した）／月ごとに分ける（読む範囲が最大 2 か月分になる）／最新の runRoot に固定するだけ（同時に始めた時に 2 つできる形が残る）／走っている子だけ別の目録から読む（面が 1 つ増える割に、2 日より長く走る子は異常なので許容で足りる）
   - 落とし穴: 量の見積りは、1 日 36 行という実測に寄りかかっている。子の数が増えれば比例して増えるので、読む幅で切る。
3. Research: mechanism
   - rootFor を呼ぶ所を挙げた。worktree.ts:80-82 と 200、tool/worktree.ts:168 と 180、tool/consult.ts:279 と 323、tool/children.ts:138、index.ts:24 と 53、run/delivery.ts:46-49。このうち読む経路は tool/children.ts:138 と index.ts:24 である。
   - readRuns は root の直下の unit だけを読む（log.ts:131-155）。
   - 置き場の上書き口は process.env.CONSULT_ROOT で、worktree.ts:139-142 にある。
   - リポジトリの頂点は `git rev-parse --show-toplevel` で取れる。実体パスに直して使う。
   - pid の再利用は `ps -o lstart= -p <pid>` で見分けられる。この環境で動き、Date.parse で読める。記録との差は 233 ms だった。同じ子なら、カーネルの開始時刻は記録の started より必ず後で、差は小さい。started は親が Date.now() で spawn の直前に取る（log.ts:28-29）ので、この向きが保証される。許容誤差は 60 秒とする。
4. Trial: 実行中の記録を数える（読み取りのみ）
   - 一覧を 1 回呼ぶと、空のフォルダが 1 個増えた（29 → 30）。
   - 開始の行の行き先を 21 本について見た。同じ runRoot に終わりがあった物が 20、別の runRoot にあった物が 1、終わりの行が無い物が 0 だった。
   - id の衝突: 13 種のうち 7 種が複数の runRoot に現れ、consult-1 は 16 個あった。
   - 量: 108 行、13.7 KB、1 日 36 行。
   - 未実施: rowOf が done と表示する例の実演、日をまたぐ子、2 日より長く走る子、30 日の掃除、worktree が同時に 2 つある時、古い配置からの移行、`git rev-parse --show-toplevel` が実体パスを返すかの確認。
5. Decision: **accepted**

### 01-3: consult

1. Agenda:
   - Title: 記録の置き場を誰が決めるか（テストが本物の記録に書けない形にする）
   - Proposal:
     - 置き場を、実行の時に環境から拾うのではなく、runtime の入力として渡す形にする。createRuntime の入力に置き場を加えて必須にし、渡し忘れたテストは型で落ちるようにする。runtime は置き場を持ち、子の起動、一覧、届け先、起動の告知に配る。本番の結線は index.ts の 1 か所で行う。あわせて consult の中に見張りのテストを置き、テストの時に置き場が本物になっていないことを赤で検知する。リポジトリ直下の test/setup.ts には触らない。
2. Highlight:
   - `pnpm test:run` を 1 回走らせるだけで、本物の /tmp/pi-consult に記録が 2 行増え、フォルダが 1 個増えた。中身は `{child: consult-1, role: review, pid: 0, state: error}` が 2 行である。
   - この汚れが記録の 8 割近くを占めていた。終わりの行 81 本のうち 62 本が pid=0 の error で、私は以前これを「62 体の子が失敗した」と読み違えた。実際はテストが書いた行だった。
   - 犯人は tool/consult.test.ts:32 である。toolCtx に `{ cwd: process.cwd() }` を渡し、CONSULT_ROOT を差し替えていない。startChild から beginRun に進んで rootFor(cwd) を呼び、本物に書く（consult.ts:279、323、333）。pid=0 は closeRecord の `pid ?? 0` で、error は `state ?? 'error'` で説明が付く（consult.ts:263、266）。
   - 直し先をリポジトリ直下の test/setup.ts にしたのは私の誤りだった。あのファイルはこのリポジトリ自身を守る物で、説明にも test/env.test.ts にもそう書いてある。1 つの拡張の置き場を product の足場に混ぜることになる。owner の指摘で気付いた。
   - 必須にすると、テストは一斉に落ちる。createRuntime を呼ぶ所は consult.test.ts:129 以降に 10 か所以上ある。落ちた所に一時ディレクトリを渡す。落ちることで、渡し忘れが残らない形になる。
   - 落とした案: 各テストで差し替える（漏れが再発する。今回まさに 1 本漏れていた）／既存の汚染 62 行を消して回る（01-2 の「移行しない」で一緒に捨てる）
3. Research: mechanism
   - runtime は createRuntime が 1 か所で作り、テストは fake の runner を渡して組み立てる（consult.ts:376-388、index.ts:55）。
   - 置き場は rootFor が process.env.CONSULT_ROOT と process.cwd() から決める（worktree.ts:125-142）。呼び手のうち、読む経路の 2 か所がテストからも踏まれる。
   - リポジトリ直下の test/setup.ts は vitest.config.ts:8 が setupFiles に指定し、GIT_* と HOME と XDG_CONFIG_HOME を 1 か所で切っている。目的は「テストが本体を汚せないこと」で、test/env.test.ts がその効きを見張っている。
   - CONSULT_ROOT を自前で差し替えているテストは 3 本ある（run/worktree.test.ts:20、tool/children.test.ts:22、tool/worktree.test.ts:11）。
4. Trial: テストの前後で記録を数える
   - `pnpm test:run` の前後で、記録は 143 行から 145 行へ、フォルダは 42 個から 43 個へ増えた。
   - 未実施: 犯人を tool/consult.test.ts に絞る確認、置き場を渡す形にすると増えなくなることの確認、自前で差し替えている 3 本が壊れないこと。
5. Decision: **accepted**

### 01-4: .children

1. Agenda:
   - Title: 一覧と音が読む記録を、いまのセッションの子に限るか
   - Proposal: 記録に session（pi のセッション id）を足し、一覧・音・起動の告知は、いまのセッションの子だけを読む。01-2 の表示規則（走っている子 + いまのセッションが起動した子）を、「いまのセッションの子（走っている・終わった・行方不明の全部）」に置き換える。**作業場の使用中判定だけはセッションで絞らない**（他のセッションの子が走っている作業場を消してはいけない）
2. Highlight:
   - owner の指摘: 別のセッションで走っている子や、別のセッションで行方不明になった子が見えると、エージェントは混乱する
   - 具体的な害: 別のセッションの子が running と出れば、私はその報告を待つ。**その報告はこのセッションには来ない**（届け先は走らせた側だから）。別のセッションの lost と出れば、私は自分の子が消えたと思ってやり直し、二重になる
   - session id は `ctx.sessionManager.getSessionId()` で取れる。resume（同じセッションを開き直す）では同じ id になる（session header の id を読むため）。reload でも同じ。新しいセッションでは別の id になる
   - pi が落ちた時に owner がするのは**同じセッションの resume** であり、別のセッションを新しく始めることは想定しない（owner の言）
   - resume では、会話（エージェントの文脈）は残り、拡張の記憶（走っている子の台帳）は消える。だから走らせた子の生死は記録でしか分からない。session で絞れば、それが自分の子だと分かる
   - 01-2 で「session 欄は足さない」と落としたのは、古い行に欄が無いことを理由にしていた。01-2 自身が移行しないと決めたのでその理由は消えた
   - 落とし穴: session id は pi が振る不透明な文字列である。記録に書くのは id だけでよい（人が読む物ではなく、照合に使うだけ）
   - 落とした案: 走っている子だけは他のセッションの物も出す（その報告はこのセッションに来ないので、待たせるだけになる。owner が却下）
3. Research: mechanism
   - `ExtensionContext.sessionManager: ReadonlySessionManager` があり、`ReadonlySessionManager` は `getSessionId` を含む（dist/core/session-manager.d.ts:178）
   - session file の header は `{type: 'session', id, timestamp, cwd}`。resume は session file を開いて header の id を読むので、id は同じになる
   - 道具の execute の ctx も `ExtensionContext` である（`.pi/extensions/consult/tool/commit.ts:39` が既にその型で書かれ、`.pi/tsconfig.json` の型検査が通っている）。だから `getSessionId` は道具からも取れる
   - 子の会話ファイル（`<unitDir>/session-<role>`）は pi のセッションとは別の物である
4. Trial: なし
5. Decision: **accepted**

## 02: definition-skill

### 02-1: .scaffold

1. Agenda:
   - Title: scaffold が definition の見出し番号を直さない問題をどう直すか
   - Proposal: 純関数 withHeading(body, nnn) を足す。渡された本文から最初の `^# Definition \S+$` の行を落とし、`# Definition <nnn>` を先頭に書く。番号は走査で決める（cycles と cycles/archive のフォルダ名の先頭 3 桁の最大値 + 1）。位置引数に数字を書けば、走査の結果を上書きする。引数は数字だけで、`--root` とは独立に扱う。数字でない物を渡した時は投げる。CLI は草案を書く前に withHeading を呼ぶ。元に見出しが無い場合は、ただ書く（投げない）。引き継ぎ元のファイルを指す位置引数は落とす。
   - 送る先: `.pi/skills/definition/scripts/scaffold.mjs`、`scaffold.test.ts`
2. Highlight:
   - いまは草案をそのまま書くので（scaffold.mjs:277）、`# Definition 015` もプレースホルダの `# Definition <NNN>` もそのまま残る。016 の実運用で見つけた。最初は `# Definition 015` で作られ、手で直した。015 の時も同じだった。
   - 見出しはフォルダ名の NNN と一致している必要がある。ずれると記録が読めなくなる。
   - owner の判断: 見出しは普通に走査して付ける。失敗した時に数字を引数で与えることもできるようにする。
   - throw するか前置するかという問いは、この形にすると消える。番号は必ず決まり（走査か引数）、見出しはそこから書くので、元に見出しが無いことは異常ではない。
   - 「走査で決まらない時」という条件は撤回する。nextNNN はフォルダが無くても 1 を返し、合わない物は飛ばす（scaffold.mjs:125-132）。だから決まらない場合は起きず、引数は上書きとして書く。
   - owner の指摘: 引き継ぎ元のファイルを位置引数で指す形は意味が分からない。番号を数字で受ける形にすればよい。いまの位置引数はファイルの道 1 つで、2 つ目は投げる（scaffold.mjs:200-218、scaffold.test.ts:90-92）。
   - 仕様の境界: 複数の見出しがあっても落とすのは最初の 1 行だけ。同じ番号で 2 回呼んでも結果は同じ（冪等）。行末の `\r` は許す。
   - 落とした案: CLI 側で文字列を置換する（テストできない）／見出しが無い時に throw する（番号が決まっていればただ書けて、投げる理由が無い）
3. Research: なし（references/format.md の見出しの形と、scaffold.mjs:23 の Template を見た）
4. Trial: 見本（memo-016-heading.mjs）で仕様を確かめる
   - `015` → `016`、`<NNN>` → `001` は置換され、いずれも 2 回呼んでも同じ結果だった。見出しが先頭行でなくても、最初に現れる行を落とした。
   - 016 の実運用では、引数なしで走らせ、フォルダ 261010-016-dev ができて、015 の definition が marker を剥がされて持ち越されることを確認した。
   - 見本は見出しが無い時に投げる古い版である（memo-016-heading.mjs:5-7）。仕様はこのエントリを正とし、見本は捨てる。
   - 未実施: CLI の結線（番号を引数で与えた時、数字でない物を渡した時、初回の Template の経路）。見本は一時物なので、永続の回帰テストを scaffold.test.ts に書く（memo は close で消す）。
5. Decision: **accepted**
