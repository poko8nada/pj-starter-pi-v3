# consult を作り直す — 設計（2026-09-28）

サイクル 009 の定義は、この文書を `Then` に書き写す所から始まる。owner の指示で例外的に直下に置く。
議論の生の記録と、owner の言葉は §12 に残す。

## 1. なぜ作り直すか（008 の実測）

いまの consult は「1 回走らせて、要らなくなったら捨てる」設計で、失敗の後始末（retry / kept / resume / ref）を周りに足してきた。結果:

- **子が自分でコミットした step は ref が作られない** — 14・17・18 の 3 連続で「変えた物が無い」と見え、worktree ごと消えた。毎回オブジェクトが残っていたので `git cherry-pick` で救えたが、保証は無い
- **「2 回目も通らなければ worktree を残す」道が実際には働いていない** — 008 で worktree が残った停止は 0 件
- **reload と走っている子でプロセスが落ちる** — 1 回。子の未コミットの作業が worktree ごと宙に浮いた
- **親が worktree を読めない** — 置き場が `os.tmpdir()`（`/private/var/folders/...`）で作業ディレクトリの外。最後の worktree と 13 本の ref を owner が消した
- **親がやり直した step が 2 つ** — 09・12（12 は 3 回）。`code` の 60 ターンは新モジュールを書く step に足りない
- **親が子に diff を用意して渡していた** — `/tmp/*.diff`。レビューは実物ではなく写しを見ていた
- **`--continue` が効かない** — 子は `--no-session` で走る
- **特例の数** — `attemptAndCommit` × `kept` × `retry` × `resume` × `sound` が同じ芯の周りで干渉している

## 2. 芯（3 つ）

1. **worktree は既定で残る**。消すのは `remove` の明示だけ
2. **1 unit = 1 worktree**（= 1 ブランチ）。同じ worktree でチケットを直列に進める
3. **結果はツリーに置く。親には最小だけ戻す**（親は id と読むべきファイルだけ持つ）

この 3 つで、上の失敗は構造的に起きなくなる。**「子が自分でコミットした」は状態として存在しなくなる**（worktree が残るので失われない）。

## 3. ロール（4 つ）

`types.json`。`environment` は廃止し、**`readOnly`** に置き換える。

| role       | readOnly | どこで走る                  | 上限            | continueByDefault | tools                                      |
| ---------- | -------- | --------------------------- | --------------- | ----------------- | ------------------------------------------ |
| `research` | true     | 親の木（worktree 指定も可） | 40 turns / 60k  | false             | read ls find grep web_search fetch_content |
| `review`   | true     | 親の木（worktree 指定も可） | 40 turns / 60k  | false             | read ls find grep web_search               |
| `trial`    | false    | **worktree 必須**           | 60 turns / 120k | **true**          | bash read ls find grep edit write          |
| `code`     | false    | **worktree 必須**           | 80 turns / 120k | **true**          | bash read ls find grep edit write          |

- **上限は全ロールに必須**（無限に走らせない）
- `code` を 60 → **80** に上げる（008 で 2 回、親がやり直す原因になった）。`trial` は 50 → **60**
- `readOnly: true` は worktree 引数が任意（無ければ親の木＝本体のブランチ）。`false` は省略 = エラー（暗黙に作らない）
- **`continueByDefault`**（表の 5 列目）は、`consult_run` の `continue` を省いたときに使う値。明示すればそれで上書きする
  - キー名を `continue` にしないのは、TS の予約語で `policy.continue` と書けないため

**`role`（型に固定する不変の規約）**:

- `research`: 調べた事実を返す。意見や提案を足さない
- `review`: 判定だけを本文で返す。直さない。根拠は `file:line` で示す
- `trial`: 試して結果を報告する。作り込まない。終わらなければ、どこまでやったかと止まった理由を報告して終える
- `code`: 依頼の範囲だけを変える。終わらなければ、どこまでやったかと止まった理由を報告して終える

**ここにチケットやサイクルの言葉を入れない**（owner: サブエージェントはサイクルのシステムと疎結合にする）。「終わらなければ報告して終える」の抽象だけを型に置き、「その報告をチケットに書く」はスキル側が `task` / `input` で伝える。道具の既定にもチケットの概念を入れない

**結果の置き場は場所ではなく型で決まる**（owner の指摘で確定）:

> 書き込めるロール（`trial` / `code`）は結果をツリー（チケット）に書く。読むだけのロール（`research` / `review`）は本文で返す。

`readOnly: true` のロールは `edit` / `write` を持たないので、worktree にいてもチケットを書けない。だから場所ではなく型で決まる（メインでレビューが走っても同じ）。

繰り返すが **これは道具の既定ではなく、スキル側の使い方**。道具はチケットを知らない。どこに何を書かせるかは、スキルが `task` / `input` で決める

## 4. 道具（4 つ）

### `consult_run` — 1 体走らせる

| 引数       | 必須 | 中身                                                                                                              |
| ---------- | ---- | ----------------------------------------------------------------------------------------------------------------- |
| `role`     | ✓    | 4 つのどれか                                                                                                      |
| `task`     | ✓    | 何をさせるか（可変の依頼はここだけ）                                                                              |
| `input`    | —    | 前置きするファイルのパス（配列）。チケットを読ませるのもここ                                                      |
| `worktree` | —    | unit id。`readOnly:true` は省略可（= main）。`false` は省略 = エラー。存在しない id = エラー                      |
| `continue` | —    | `true` でその worktree の会話の続き（**既定 `false`** = 同じ worktree で新しい会話。review の独立性はこれで保つ） |

戻り値: `started: <child id>` をすぐ返す（親は待たない）。完了時に §6 の塊が届く。

### `consult_children` — 走っている子の一覧と停止

| 引数     | 必須            | 中身                     |
| -------- | --------------- | ------------------------ |
| `action` | —               | `list`（既定）/ `cancel` |
| `id`     | cancel のとき ✓ | 止める子                 |

戻り値: `id / role / worktree / 経過 / ターン / 費用`。

### `consult_worktree` — worktree の生成・一覧・削除

| 引数     | 必須             | 中身                                |
| -------- | ---------------- | ----------------------------------- |
| `action` | —                | `new` / `list`（既定）/ `remove`    |
| `id`     | new・remove で ✓ | **unit id**（例 `2-consult.retry`） |
| `base`   | —                | 分岐元（既定 `HEAD`）               |
| `force`  | —                | `remove` で、変更が残っていても消す |

戻り値:

- `new` → `id` / `branch`（**`consult/<unit-id>`**）/ `path` / `base`
- `list` → 各 worktree の `id / branch / path / 作った時刻 / 変更ありか / 走っている子の数`（`git worktree list` と `consult/*` から導出。**台帳ファイルは持たない**）
- `remove` → 消した（走っている子がいる worktree は拒否）

### `consult_commit` — worktree でコミットする

| 引数       | 必須 | 中身                                              |
| ---------- | ---- | ------------------------------------------------- |
| `worktree` | ✓    | unit id                                           |
| `message`  | —    | 省略時は `consult(<unit>): <何をした>` の型で作る |

戻り値: **`committed: <hash>`** / **`rejected: <フックの出力>`** / **`no change`**（差分が無い）

- 親はパスを知らずに済む（親は id で話す。tmp の規約がスキル側に漏れない）
- フック拒否を構造化して返す（008 で作業を 3 回失った原因がここ）
- **merge はしない**（main 側の操作は CLI。§9）

### 消える物

- `consult_new` → `consult_run` に吸収
- `consult_resume` → `consult_worktree` と `consult_run{continue:true}` に吸収（「再開」という別概念が消える）
- `consult_refs` → 不要（ref が受け渡しの道でなくなる）
- `stopped.json` → 不要（worktree が残るので、失う物が無い）

## 5. 場所と名前

- 置き場: **`/tmp/pi-consult/<project>-<YYYYMMDD-HHMM>/`**（project はリポジトリのルート名）
  - `/tmp` は親の bash / `read` / `git worktree` が全部通るので、**規則を増やさずに親も子も読める**（実測 §13）
  - macOS の `os.tmpdir()`（`/private/var/folders/...`）は作業ディレクトリ外で弾かれるので使わない
- **worktree 名 = unit id**。引数で渡すのは id だけ（プレフィックスは tmp 側）
- 1 unit の中身: `<root>/<unit-id>/wt`（worktree 本体）と `<root>/<unit-id>/log.jsonl`（走った記録。worktree の外に置くので、リポジトリに untracked が出ない）
- ブランチ: **`consult/<unit-id>`**（`--detach` をやめる）
- **本体 = 親が起動したブランチ**。worktree の `base` の既定は**親の HEAD**（＝親がいまいるブランチの先端）で、`main` を仮定しない。取り込み先もそのブランチ
- **同時に書けるのは 1 体**（git の index / lock を共有するため。unit 内は直列。id が unit なので、別 unit の子を同じ worktree に送ることは構造的にできない）
- `/tmp` は再起動で消える。worktree 本体は揮発でよい（**残すべき記録はチケット＝リポジトリ側にある**）

## 6. 子のセッションと、親に戻る値

**子の起動**: モデル、tools、上限、`--session <root>/<unit-id>/session`（worktree ごとに 1 つ）。
`continue: true` のときは `--continue`（同じセッションの続き）。子のセッションには guard 拡張（`pi` を spawn できない、秘密を読めない）と **budget 拡張**を注入する。

**budget 拡張（最後の 1 ターン前に自動報告させる）**:

1. 親が上限を env（`CONSULT_TURNS`）で渡す
2. 子の `turn_end` を数える
3. `CONSULT_TURNS - 1` で `custom_message` に「**次が最後のターンです。状況を報告してください**」を差し込み、`continue: true` を返す（pi の docs `extensions.md:109` がこの口を明記）
4. 最後のターンで子が自分で状況を書く → 親は `stopped: turn-limit` と**子自身の報告**を受け取る

副次効果: `stopped` の本文が「turn limit reached」だけにならない（008 では親が worktree を読んで理由を推測していた）。

**親に戻る塊**（子 1 体 = 1 塊）:

```
[consult] <id> <role> <unit>
state: done | stopped (<reason>)
verdict: <review は判定（最大 20 行）。他は 1〜3 行>
files: <変えたファイル>
turns: <n>/<limit>, spend: <$x>
worktree: <unit> (<path>)
```

- `reason`: `turn-limit` | `hook-rejected` | `error` | `aborted`
- **diff は渡さない**（親が要るなら `git -C <path> diff`）
- これで親が持つのは「id と、読むべきファイル」だけになる＝**メインの負荷が減る**（owner の狙い）

**ありえる戻り値は 6 つで全部**:

1. `done` + files あり
2. `done` + files なし
3. `stopped: turn-limit`
4. `stopped: hook-rejected`
5. `stopped: error`
6. `stopped: aborted`

**止まった次の 2 択だけ**:

- `consult_run{role, task: "続き", worktree: <同じ id>, continue: true}`
- 何もしない（worktree は残る）

道具は **retry しない**（親が決める）。

## 7. 流れの例（1 unit、2 チケット）

1. 親: `consult_worktree{action: new, id: "2-consult.retry"}` → `branch: consult/2-consult.retry`
2. 親: `consult_run{role: code, worktree: "2-consult.retry", input: [<チケット>], task: "<step の中身>"}`
3. 子: 実装し、終わらなければチケットに状況を書く → `done` / `stopped` が親に届く
4. 親: `Verify` を**親のツリーで**実行（008 と同じ。親が値を見る）
   - 通った → 親: `consult_commit{worktree}` → `committed: <hash>` → チケットの `Commit:` に書く
   - 落ちた → 親: `consult_run{continue: true, task: "直す所"}`（同じ worktree・同じ会話）
5. 次のチケットも同じ worktree で（手順 2〜4）
6. unit の終わり: 親: unit レビュー（`consult_run{role: review, worktree: <同じ id>}`。観点を局所化するのはスキル側の仕事）
7. 親: `git merge --no-ff consult/2-consult.retry`（親のブランチ側なので CLI）

## 8. コミットと merge

- **チケットがちゃんと終わった時に worktree でコミットする**（owner）。「ちゃんと終わった」を判定できるのは親だけ（子は `Verify` を実行しない）ので、**コミットするのは親**。子が自分でコミットしても失われない（worktree が残るため）
- コミットの道具は `consult_commit`（worktree 側）。**merge は CLI**（親のブランチ側）
- **境界: 親のディレクトリで完結する操作は CLI。tmp のパスが要る操作は道具。**
- merge は **`--no-ff`**。`--ff-only` だと本体が直線になり unit の単位が消える
- **ブランチを消してもハッシュは残る**（本体から辿れる。消えるのは squash したときだけ）
- **`git log --first-parent` で本体は 1 unit = 1 行**になる（merge commit が checkpoint）
- **rebase はしない**（ハッシュが変わる）。本体のブランチが進んでいたら merge で解く
- チケットの `Commit:` には**そのチケット自身の commit のハッシュ**を書く（merge 後も本体の実物と一致する。cherry-pick ではこれができなかった）
- 本体のブランチへ取り込むのは **unit の終わりにまとめて**（unit が checkpoint の単位で、unit レビューと噛み合う）

## 9. 決めた未決（owner が後で覆せる）

| 論点                              | 私の裁定                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| 道具の名前                        | `consult_run` / `consult_children` / `consult_worktree` / `consult_commit`                 |
| `continue` の既定                 | ロールの属性。`trial` / `code` は `true`、`research` / `review` は `false`。引数で上書き可 |
| 疎結合                            | 型と道具にチケット・サイクルの言葉を入れない。スキル側が `task` / `input` で強制する       |
| 上限                              | research 40 / review 40 / trial 60 / **code 80**（008 の実測から）                         |
| `consult_refs` / `consult_resume` | 消す（吸収先は §4）                                                                        |
| 停止の記録                        | worktree の外（`<root>/<unit-id>/log.jsonl`）。リポジトリに untracked を出さない           |
| 台帳                              | 持たない（`git worktree list` + `consult/*` ブランチから導出）                             |
| `verdict` の長さ                  | review 最大 20 行、他は 1〜3 行                                                            |
| コミットの単位                    | チケットごと / merge は unit ごと                                                          |
| `Commit:` の中身                  | そのチケット自身の commit のハッシュ                                                       |
| 子が自分でコミットした場合        | 親のコミットが `no change` になるだけ。害は無い                                            |
| main が進んでいた場合             | merge で解く（rebase しない）                                                              |
| worktree の寿命                   | 再起動まで（`/tmp`）。残すべき記録はチケット側にある                                       |
| 拡張の名前                        | `consult` のまま（`consult_run` 等は道具名）                                               |

## 10. 移行（009 の作業）

1. `policy/types.ts` と `types.json`: `environment` → `readOnly`、`continueByDefault` を足す、`code` の上限 80 / `trial` 60
2. `tool/consult.ts` を 4 つの道具に分ける（`run` / `children` / `worktree` / `commit`）
3. `run/`: worktree をブランチで作り、既定で残す。`commitWorktree` / `kept` / retry ループを捨てる。`resume.ts` / `stopped.ts` を捨てる
4. `child/budget.ts` を足す（§6）。guard はそのまま
5. `index.ts`: 4 つの道具と `/consult-*` コマンドを登録。sound はそのまま
6. `consult/README.md` を書き直す
7. **スキルを合わせる**（`work` / `close` / `plan` / `tickets` の consult の使い方。ここは 009 の中で別の step）

## 11. 実測（permission）

- `/tmp` は bash の write / read も、`read` 道具も、`git worktree add --detach` / `worktree remove` も通る
- 弾かれるのは `/private/var/folders/...`（macOS のユーザー別 tmp）で、規則は `external_directory`（作業ディレクトリの外）
- したがって置き場を `/tmp/pi-consult/` にしても規則は増えない

## 12. owner の言葉（決定の出どころ）

- 「次のサイクルでは consult の作り直しだけ。これをしっかり作り直してスキルをそれに合わせる、そう言う手順」
- 「ワークツリーはスクリプト側で生成はするが、**明示しないと残る**設計にしたい」
- 「そのワークツリーで**全ロールを走らせることができる**ようにしたい。あと **continue** をできるようにしたい」
- 「ワークツリーはどこの tmp に作るかを決めておいて、**親もパーミッションで見れる**ようにするのはどうか、グローバルの `/tmp/` とかかな？」
- 「そもそもスクリプトで**インスタントに走らせて、やったことが全て残らない可能性があるという設計自体**を考え直した方が良い」
- 「**レビュワーも残ったワークツリーに直接送り込めば**、read 権限だけで中身を見て貰えばいい。**こっちで diff を用意しない**」
- 「consult の改良より、**新しく作り直す方が簡単**でありそう」
- 「ロール側に設定を入れて、**readOnly を bool** がわかりやすい。true は引数なしで main、worktree を明示指定したらその worktree。false は worktree の引数が必要」
- 「ワークツリーの場所と名前はもっと工夫が必要。自動で**プレフィックスとしてプロジェクトルート名と日時**、場所は **`/tmp/pi-なんとか`**、引数で指定するのはプレフィックスはなし。**ワークツリー名はユニット id** にしていいかもしれない。**ワークツリーの数 = ユニットの数**とするみたいな」
- 「全ロールは**上限があった方が良い**、無限に走るので」
- 「メインが結果を受け取って、よりも**チケット渡して、ワークツリーに送り込んで、任せる**ぐらいの単純さが必要。**ターン数が尽きたとか、何をキャッチして、次にどうするかをなるべく簡単に**」
- 「**メインでレビューが走ることもままあるから、そこが逆にややこしくならないかな？**」→ §3 の「型で決める」に至った
- 「同じワークツリーでユニットごとに直列で実装するから、**チケットがちゃんと終了した時に、そのワークツリーでコミット**はするべきだと思う」
- 「ブランチにしてマージする方式の場合、**ハッシュは残るか**、ブランチを削除しても。メイン側から見ると**チェリーピックと違って、マージコミットだけになる**から、メインが短くなるからいいなと思った」
- 「**コミットも、ワークツリーのは、ツール化した方が良くない？** メインへのマージは普通に CLI でいい気がするけど」→ §8 の境界
- 「基本的に、**決まってないことは、君のアイデアベースでいい**と思う」

## 13. 途中で捨てた案（記録）

- **worktree をリポジトリ内（`.pi/wt/`）に置く** — 私の案。owner が却下（製品の木に worktree の登録が並ぶのはアンチパターン）。`/tmp` が親から読めることが実測で確認できたので不要になった
- **「worktree の子はチケット、main の子は本文」** — 私の案。owner の指摘（メインでレビューが走る）で破綻し、「型で決める」に直した
- **`--ff-only` で取り込む** — 私の案。main が直線になり unit の単位が消えるので `--no-ff` に直した
- **停止記録を揮発しない所へ** — 記録の本体はチケット（リポジトリ側）にあり、worktree の log は揮発でよいと整理した

## 14. リロードで落ちない（008 の `Carry over` 4 本目。作り直しの要件）

何が起きたか（008）: owner が reload したとき、子を走らせていた拡張が**古い `pi` への参照**を握ったまま `deliver` → `pi.sendMessage` を呼び、プロセスが落ちた。子の未コミットの作業が宙に浮いた。

### 14.1 原則

1. **子を pi のプロセスに従属させない**（detach して spawn する）。pi が落ちても子は自分の worktree で働き続け、終わったら結果を自分で書く
2. **セッション限りの資源は `session_shutdown` で手放す**（音のタイマーは 008 で既にそうした）。子は**殺さない**（殺すと作業が消える）
3. **`pi` の参照越しに外部へ送らない**。完了通知は「セッションごとの delivery」を通し、reload で**差し替わる**。古い delivery は no-op になり、代わりに `log.jsonl` に追記する（stale を叩けば落ちる）
4. **新しいインスタンスは起動時に `log.jsonl` を読む**。前のセッションで走っていた子の結果を拾い、`consult_children{action: list}` に出す（親は reload をまたいでも追える）

### 14.2 記録に残す物

`<root>/<unit-id>/log.jsonl` の 1 行に: `child id / role / pid / 開始時刻 / 終了時刻 / state / reason / files / turns / spend`

- **pid を書く** → reload 後に生存確認できる（動いている子を新しいインスタンスが見失わない）
- 結果の本体（判定や報告）は子が置いた場所（チケットなど）にあり、log は索引

### 14.3 検証（`Then` にする）

- 新しいインスタンスを作ってから（reload 相当）古いインスタンスの完了ハンドラを呼んでも**落ちない**。結果は log に追記される
- reload をまたいで、走っていた子の行が `consult_children{action: list}` に出る
- 子が動いている最中に reload しても、子の worktree の中身は無傷（worktree は残る設計なので、ここは構造的に満たされる）
