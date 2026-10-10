# PLAN `consult-readme`

## Files

```text
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
       - (empty) `grep -c "unit-id/log.jsonl" .pi/extensions/consult/README.md` → `0`
       - (happy) `grep -n "records/" .pi/extensions/consult/README.md` → `consult_children` の節と `consult_worktree` の `record` の行の 2 か所が `records/<project>/<YYYY-MM-DD>.jsonl` の形
       - (happy) `grep -n "today and yesterday" .pi/extensions/consult/README.md` → 1 件以上（読む幅）
       - (happy) `grep -n "30 days" .pi/extensions/consult/README.md` → 1 件以上（起動のたびの掃除）
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
       - (happy) `grep -c "lost" .pi/extensions/consult/README.md` → 1 以上（この plan を入れる前は 0 だった。消すと 0 に戻るので、slice 4 の壊しが見分けられる）
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
       - (error) `lost` の説明を消す → slice 2 の `grep` が赤に戻る（確かめたら戻す）
       - (error) `Sound` の節を「最後の子で止まる」に戻す → slice 3 の `grep` が赤に戻る（確かめたら戻す）
       - (error) reload の段落を「一覧に出る」に戻す → slice 3 の `grep` が赤に戻る（確かめたら戻す）
   - Steps:
     1. `README.md`: slice 1–3 の残りを閉じる（残り物はないはず）
     2. `README.md`: `Tests` の節の列挙を、実装のテストファイルの並びと突き合わせる

## Notes

### Slice 1: 記録の場所と形

- Findings: なし
- Unplanned: なし
- Commit: (see git log consult(consult-readme): slice 1 record place)
- Verify (cli, done here): `unit-id/log.jsonl`→0; `records/`→lines 68, 87 in `records/<project>/<YYYY-MM-DD>.jsonl` form; `today and yesterday`→line 68; `30 days`→line 99. No read/look in this slice.

### Slice 2: 一覧の範囲と、行の見え方

- Findings: なし
- Unplanned: なし
- Commit: (see git log consult(consult-readme): slice 2 list scope)
- Verify (cli, done here): `a previous session`→0; `shows children a previous session started`→0; `lost`→1 (line 66); `What comes back` state stays 4 without `lost` (line 140); slice 1 greps still green.
- Verify (look/read, 親がやる): look 4 件（いまのセッションの子だけ／`lost` の意味／`state` は 4 つのまま／`remove` はセッションを問わず断る）と read 1 件（review の子に README＋tool/children.ts＋tool/worktree.ts＋run/log.ts＋run/place.ts を突き合わせ）は親がやる。

### Slice 3: 止め方と、音と、報告

- Findings:
- Unplanned:
- Commit:

### Slice 4: 統合: README が実装と一致する

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Unproven:

## Acceptance

- Ran:
- Findings:
