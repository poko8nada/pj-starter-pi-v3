# PLAN `consult-readme`

## Files

```text
README.md                     update
README.ja.md                  update
.pi/extensions/consult/
  README.md                   update
```

## Slices

1. 記録の場所と形
   - I/O:
     ```text
     直す記述 → 新しい主張（決めているのは ADR 01-2、実装は run/place.ts と run/log.ts）
     表の consult_children の行: `Reads a record, so it still shows a reload's children`
       → 記録を読むので、reload をまたいでも同じセッションの子は出る
     一覧の節: `<root>/<unit-id>/log.jsonl`
       → `<root>/records/<project>/<YYYY-MM-DD>.jsonl`。読むのは今日と昨日の 2 ファイル
     consult_worktree の表の `record` の行: 記録も会話も unit の入れ物の下、というひとまとめの説明
       → 記録だけが `records/<project>/<YYYY-MM-DD>.jsonl` へ移ったことを書く。作業場と会話は `<root>/<unit-id>/` の下に残る（ひとまとめを分ける）
     掃除の説明（`session_start` の所）: worktree の掃除だけ
       → 起動のたびに、30 日より古い記録のファイルも消す
     ```
   - Verify:
     - cli: `grep -n` で行を出して 1 行ずつ読む
       - (empty) `grep -c "log.jsonl" .pi/extensions/consult/README.md` → `0`（古い置き場の名残が無いこと。新しい置き場が書いてあるかは隣の `records/` で見る）
       - (happy) `grep -n "records/" .pi/extensions/consult/README.md` → `consult_children` の節と `consult_worktree` の `record` の行の 2 か所が `records/<project>/<YYYY-MM-DD>.jsonl` の形
       - (happy) `grep -n "today and yesterday" .pi/extensions/consult/README.md` → 1 件以上（読む幅）
       - (happy) `grep -n "deletes record files older than 30 days" .pi/extensions/consult/README.md` → 1 件（起動のたびの掃除。`Tests` 節の「the files older than 30 days」には当たらない綴り）
   - Steps:
     1. `README.md`: 表の `consult_children` の行と、一覧の節の記録の場所・読む幅を直す
     2. `README.md`: `consult_worktree` の表の `record` の行を直す
     3. `README.md`: `session_start` の掃除の説明に、記録のファイルを足す

2. 一覧の範囲と、行の見え方
   - I/O:
     ```text
     直す記述 → 新しい主張（決めているのは ADR 01-2 と 01-4、実装は tool/children.ts と tool/worktree.ts）
     一覧の節: 前のセッションが始めた子も出る、という説明
       → 出るのは、いまのセッションの子だけ。別のセッションの子は見えない
     行の説明: 走っている子は `running (pid <n>)`、終わった子は 4 つの状態
       → 終わりの行が無く pid も死んでいる子は `lost`（`done` と偽らない）
     `remove` の bullets: 子が走っている作業場は断る
       → セッションを問わず断る（別のセッションの子が走っている作業場も消さない）
     `What comes back` の `state` の行: 4 つのまま（`lost` は一覧の行だけの値）
     ```
   - Verify:
     - cli: `grep -n` で行を出して 1 行ずつ読む
       - (empty) `grep -c "a previous session" .pi/extensions/consult/README.md` → `0`（古い「前のセッションの子も出る」が消えている）
       - (empty) `grep -c "shows children a previous session started" .pi/extensions/consult/README.md` → `0`
       - (happy) `grep -c "not passed off as" .pi/extensions/consult/README.md` → 1 以上（一覧の行の説明にしか無い語。この plan を入れる前は 0 だった。消すと 0 に戻るので、slice 4 の壊しが見分けられる）
     - look: 直した節を人が読んで答える（grep で語を見分けられない物）
       - (happy) 一覧の節に、出るのは いまのセッションの子だけだと書いてある（`grep "this session"` は `cancel` の文にも当たるので、grep では見分けない）
       - (happy) 行の説明に `lost` があり、終わりの行が無く pid も死んでいる子のことだと読める
       - (happy) `What comes back` の `state` は 4 つのままで、`lost` が混ざっていない
       - (happy) `remove` の所に、セッションを問わず断ることが書いてある
     - read: `review` の子 1 体に `.pi/extensions/consult/README.md` と `tool/children.ts` と `tool/worktree.ts` と `run/log.ts` と `run/place.ts` を読ませ、この slice の 2 つの主張（いまのセッションの子だけが出る／作業場の使用中判定はセッションで絞らない）が実装と合っているかを報告させる。**`lost` とセッションの絞りと読む幅は `run/log.ts` と `run/place.ts` にいる**
   - Steps:
     1. `README.md`: 一覧の節を、いまのセッションの子だけが見える形に直す
     2. `README.md`: 行の説明に `lost` を足す
     3. `README.md`: `remove` の所に、セッションを問わず断ることを書く

3. 止め方と、音と、報告
   - I/O:
     ```text
     直す記述 → 新しい主張（決めているのは ADR 01-1、実装は tool/consult.ts・tool/sound.ts・run/delivery.ts・index.ts）
     止め方: 止めるのは `AbortSignal` の子だけ
       → そのインスタンスが掴んでいる子は `AbortSignal`。reload の前から走っている子は、記録の pid に SIGTERM を送って止める
       → 送るだけで、記録を書くのはその子を持っていた側。持っていた側が既に居なければ、その子の行は `lost` のまま見え、作業場も残る
     音: 最後の子が終わると止まる
       → 5 秒ごとに記録を読み直し、いまのセッションの走っている子が居なければ自分で止まる。off の間もタイマーは動く（鳴らないだけ）
     reload の段落: 次の起動の一覧に出る
       → 届け先が無い間に終わった子の報告は記録に残り、同じセッションの次の起動が 1 つずつ渡す。渡し終えてから目録を進める（重複はあるが失わない）
     30 秒の quiet で止まる子と、音の設定はセッション限りという記述は、そのまま残す
     `Tests` の節: 増える `run/place.test.ts` と、変わる 7 本（`run/log.test.ts`・`run/worktree.test.ts`・`run/delivery.test.ts`・`tool/consult.test.ts`・`tool/children.test.ts`・`tool/worktree.test.ts`・`tool/sound.test.ts`）の名を、全部書く（1 本 1 行でなくてよい。現物の節は長い散文 1 行）
     ```
   - Verify:
     - cli: `grep -n` で、古い言い方が消えていることを見る
       - (empty) `grep -c "stops when the last child" .pi/extensions/consult/README.md` → `0`（「最後の子で止まる」が消えている）
       - (empty) `grep -c "shows it in" .pi/extensions/consult/README.md` → `0`（一覧が出す、とは書かない）
       - (empty) `grep -c "killed through its" .pi/extensions/consult/README.md` → `0`（無限定の AbortSignal が消えている。現物は AbortSignal をバッククォートで囲んでいるので、囲みを含めない語で見る）
     - look: 直した節を人が読んで答える
       - (happy) 止め方に `SIGTERM` があり、掴んでいる子の `AbortSignal` と、記録の pid へ送る道の 2 つだと読める
       - (happy) `Sound` の節が、5 秒ごとに記録を読み直し、いまのセッションの走っている子が居なければ自分で止まると書いてある
       - (happy) reload の段落が、報告は記録に残り、同じセッションの次の起動が 1 つずつ渡すと書いてある
     - read: `review` の子 1 体に `.pi/extensions/consult/README.md` と `tool/consult.ts` と `tool/sound.ts` と `run/delivery.ts` と `run/log.ts` と `index.ts` を読ませ、この slice の 3 つの主張が実装と合っているかを報告させる
   - Steps:
     1. `README.md`: `consult_children` の節の `cancel` の説明を直す
     2. `README.md`: `Background and stopping` の節を直す
     3. `README.md`: `Sound` の節を直す
     4. `README.md`: `Tests` の節を、増える `run/place.test.ts` と、変わる 7 本のテストファイルに合わせて直す

4. 統合: README が実装と一致する
   - I/O:
     ```text
     なし（slice 1–3 の合わせを確かめる）
     前提: record-and-delivery が先に merge されていること（書く物は振る舞いより後に merge する）
     ```
   - Verify:
     - cli: 前提
       - (happy) `git log --oneline -20` に `record-and-delivery` の merge があり、`run/place.ts` が存在する
     - read: `review` の子 1 体に、README 全体と `.pi/extensions/consult/` の `run/`・`tool/` の全部を突き合わせさせ、食い違いを 1 件 1 行（`README の行 → 実装の file:行`）で報告させる
       - (empty) 食い違いが 0 件
     - form: `Tests` の節が、この plan が触る 8 本の名を全部持っているか
       - (happy) `for f in run/place.test.ts run/log.test.ts run/worktree.test.ts run/delivery.test.ts tool/consult.test.ts tool/children.test.ts tool/worktree.test.ts tool/sound.test.ts; do grep -q "$f" .pi/extensions/consult/README.md || echo "ない: $f"; done` の出力が空（行数では見ない。節は長い散文 1 行なので、数の比較は当たらない）
     - cli: 壊し
       - (error) 記録の場所を 1 か所だけ古い形に戻す → slice 1 の `grep` が赤に戻る（確かめたら戻す）
       - (error) README から一覧の行の `lost` の説明そのものを消す → slice 2 の `grep -c "not passed off as"` が `0` になり赤に戻る（確かめたら戻す）
       - (error) `Sound` の節を「最後の子で止まる」に戻す → slice 3 の `grep` が赤に戻る（確かめたら戻す）
       - (error) reload の段落を「一覧に出る」に戻す → slice 3 の `grep` が赤に戻る（確かめたら戻す）
   - Steps:
     1. `README.md`: slice 1–3 の残りを閉じる（残り物はないはず）
     2. `README.md`: `Tests` の節の列挙を、実装のテストファイルの並びと突き合わせる

## Notes

### Slice 1: 記録の場所と形

- Findings: なし
- Unplanned: なし
- Commit: `fc20776` `consult(consult-readme): slice 1 record place`
- fixed: check を `30 days` → `deletes record files older than 30 days` に変えた（`Tests` 節に当たらない綴り）
- Verify (cli, done here): `log.jsonl`→0; `records/`→lines 68, 87 in `records/<project>/<YYYY-MM-DD>.jsonl` form; `today and yesterday`→line 68; `30 days`→line 99. No read/look in this slice.

### Slice 2: 一覧の範囲と、行の見え方

- Findings: なし
- Unplanned: なし
- Commit: `aafac6b` `consult(consult-readme): slice 2 list scope`
- fixed: check を `lost` → `not passed off as` に変えた（一覧の行の説明にしか無い語）
- Verify (cli, done here): `a previous session`→0; `shows children a previous session started`→0; `lost`→1 (line 66); `What comes back` state stays 4 without `lost` (line 140); slice 1 greps still green.
- Verify (look/read, 親がやる): look 4 件（いまのセッションの子だけ／`lost` の意味／`state` は 4 つのまま／`remove` はセッションを問わず断る）と read 1 件（review の子に README＋tool/children.ts＋tool/worktree.ts＋run/log.ts＋run/place.ts を突き合わせ）は親がやる。

### Slice 3: 止め方と、音と、報告

- Findings: なし
- Unplanned: なし
- Commit: `6346f50` `consult(consult-readme): slice 3 stop sound report`
- Verify (cli, done here): `stops when the last child`→0; `shows it in`→0; `killed through its`→0; `SIGTERM`→lines 68, 189; `re-reads the record`→line 195; Tests 8 本すべて有り; `30 seconds of quiet` と `lasts for this session only` は残した; slice 1–2 の grep も緑のまま.
- Verify (look/read, 親がやる): look 3 件（SIGTERM の 2 経路／Sound の 5 秒読み直しと自停／reload 報告の記録残しと 1 つずつ配達）と read 1 件（review の子に README＋tool/consult.ts＋tool/sound.ts＋run/delivery.ts＋run/log.ts＋index.ts を突き合わせ）は親がやる。

### Slice 4: 統合: README が実装と一致する

- Findings:
  - Tests 節が `run/run.test.ts` に言及しているが、そのファイルは実装に無い（`run/` には `child.test.ts` がいる）。
    - `left: この plan の I/O（slice 1–3 の 8 本）の範囲外で、正しい置き換え（記述の振り分け直し）の判断が付かないため直さない。親の read の判断に任せる`
    - `fixed: README の run/run.test.ts を run/child.test.ts に直した`
    - `fixed: Tests 節を実態に合わせた（run/child と tool/children の説明を現物通りに書き直し、child/guard・tool/render・tool/run の 1 文を追加）。名指し 16 本と実在 16 本が一致することを両方向で確認`
    - `fixed: 完了メッセージの順序（1 行目 consult <id> (<type>) finished→塊→--- と子の本文→[consult] 行）と tool/consult.test.ts の説明（塊でなく子のテキスト・ref・[consult] 行を断言）を現物に合わせた`
    - `fixed: ルート README.md:15 と README.ja.md:15 を this session 絞りに合わせ、## Files に 2 つを足した`
    - `fixed: 壊し 2 を新 check に合わせて書き直した（赤になることを実証・復元済み）`
    - `fixed: 残りの read 3 件を直した（record 行の作業場・会話の場所を path 行の書き方に揃えて正確化／Tests 節の model attempt order を削除（参照するテスト無しを grep 確認）／tool/consult.test.ts の説明から ref を外し子の本文と [consult] 行のみに）`
- Unplanned: なし
- Commit: `1f79e43` `consult(consult-readme): slice 4 integrate`。Round 1 の修正は `311827f`・`24ba392`・`ecab7dc`・`98f60ba`・`d3da289`・`01587d7`
- Verify (cli, done here): 前提 `git log --oneline -20` に `record-and-delivery` の merge 有り・`run/place.ts` 有り。壊し 4 件すべて赤→緑を確認（記録の場所→slice 1 赤／`lost` 消し→slice 2 赤／Sound 戻し→slice 3 赤／reload 段落戻し→slice 3 赤、すべて復元済み・作業ツリー clean）。
- Verify (form, done here): 8 本 (`run/place` `run/log` `run/worktree` `run/delivery` `tool/consult` `tool/children` `tool/worktree` `tool/sound` の各 `.test.ts`) すべて有り・出力空。
- Verify (read, 親がやる): review の子に README 全体と `run/`・`tool/` の全部を突き合わせ（食い違い 0 件を期待）は親がやる。

## Review

### Round 1

- Stale:
  - ルートの `README.md:15` は `consult_children` を「このプロジェクトの子の一覧」と書いたままなので、新しい「このセッションの子だけ」と食い違っている。
  - ルートの `README.ja.md:15` は「このプロジェクトの子を一覧し」と書いたままなので、新しい「このセッションの子だけ」と食い違っている。
- Unlisted:
  - なし
- Gaps:
  - なし
- Unproven:
  - slice 1 の `grep -n "30 days"` は `session_start` の掃除の文のほか Tests 節の `run/place.test.ts` の説明にも当たるため、掃除の文を消しても緑のままになる。
  - slice 2 の `grep -c "lost"` は一覧の行のほか配達の none is lost・止め方の stays lost・Tests 節にも当たるため、行の `lost` の文を消しても緑のままになる。

### Round 2

- Stale:
  - なし
- Unlisted:
  - なし
- Gaps:
  - なし
- Unproven:
  - なし

（子（`consult-40`）の報告から親が記録した。この子は plan md に書かなかった。4 件とも現物で直っていると確認された — ルート `README.md:15` は `lists the children of this session` と `still shows this session's children across a reload`、`README.ja.md:15` は「このセッションの子を一覧し」「このセッションの子は出る」になり、旧い綴りは grep で 0 件。plan の Files にルートの 2 本が足されていることも確認。slice 1 の check `deletes record files older than 30 days` は `README.md:99` の掃除の文 1 件にだけ当たり、`:227` の `the files older than 30 days` には当たらない。slice 2 の check `not passed off as` は `:66` の 1 件にだけ当たり、`:195` の `stays lost` や `:227` の `lost` には当たらない）

## Acceptance

- Ran:
  - plan の `cli` のケース（親が再実行）:
    - slice 1 = `log.jsonl` 0 / `records/` 2 / `today and yesterday` 1 / `deletes record files older than 30 days` 1
    - slice 2 = `a previous session` 0 / `shows children a previous session started` 0 / `not passed off as` 1 / `state` は 4 つのまま（146 行）
    - slice 3 = `stops when the last child` 0 / `shows it in` 0 / `killed through its` 0 / `SIGTERM` 2 / `re-reads the record` 1
  - `form`: 8 本の名が全部あり（出力空）。名指しと実在の一致（16＝16）は `consult-32` が両方向で確認
  - ルート `README.md` / `README.ja.md`: 旧い `children of this project` と「このプロジェクトの子」は 0 件
  - 壊し 1: 古い置き場の文（`<root>/<unit-id>/log.jsonl`）を戻す → `log.jsonl` が 1 件（0 期待）→ 赤 → 復旧
  - 壊し 2: 一覧の行の `lost` の説明を消す → `not passed off as` が 0 件（1 期待）→ 赤 → 復旧
  - 壊し 3・4（子が実施）: `Sound` の節を「最後の子で止まる」に戻す → slice 3 の `grep` が赤 / reload の段落を「一覧に出る」に戻す → slice 3 の `grep` が赤（どちらも復元済み）
  - plan の `look`（親が読んだ）: slice 2 の 4 項目（いまのセッションの子だけ＝68 行・`lost` の意味＝66 行・`state` は 4 つのまま＝146 行・`remove` はセッションを問わず断る＝95 行）と slice 3 の 3 項目（止め方の 2 つの道＝195 行・音の 5 秒読み直しと自停＝201 行・reload 後の報告＝184 行）とも期待どおり
  - plan の `read`（親が実行、3 回）: 1 回目 = 5 件 → 全部修正 / 2 回目 = 2 件 → 全部修正 / 3 回目 = 3 件 → 全部修正（打ち切り宣言どおり、その 3 件の修正は `read` を再実行していない）
  - レビュー（work スキルの手順 5）: Round 1 = 4 件（Stale 2・Unproven 2）→ 全部修正、Round 2 = 4 件とも現物で直っていると確認され、4 観点 なし
- Findings:
  - plan の check の空振り 2 件（親の壊しで発覚）: slice 1 の `grep -c "unit-id/log.jsonl"` は直す前から 0 件（旧い文は `<root>/<unit-id>/log.jsonl` で間に `>` が挟まる）、slice 4 の壊し 2 は `lost` が他に 3 か所あるため赤にならない
    - `fixed: `log.jsonl`と`deletes record files older than 30 days`に締め直し、壊し 2 を「一覧の行の`lost` の説明そのものを消す」に直した（`01587d7`）`
  - 3 回目の `read` の 3 件の修正は、`read` を再実行して確かめていない（打ち切り宣言のため）。現物の読み合わせだけで確かめた
    - `left: その 3 件は `## Notes`の Slice 4 の`fixed:` に記録した。食い違いが残っていないかは close の残り物で裁く`
