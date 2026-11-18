# Close 072

## Collected

### 01 interrupt-message (ADR 01)

1. 266 / Work Review Round 1 / `.pi/extensions/thinking-scrub/live/guard.ts:39` — `FOLLOWUP_TEXT`の文言（止めた理由を1文で述べ、次の一歩を求め、見本を含まず、回答領域で思考の続きを書かせない短さ）を確かめる検査がない。`index.test.ts`は`customType`と`display`しか見ないため、Goalの核心が検査がないまま残る。 / left: 固定文言はADRの`Details`そのものであり、定数の内容検査は同語反復になるためテストしない。`Always`の読み合わせで`FOLLOWUP_TEXT`とADRの`Details`を突き合わせて確認する。
2. 268 / Work Review Round 1 / `.pi/extensions/thinking-scrub/live/guard.test.ts:35` — `observe`のstopが`pending:true`を立てることを確かめていない（`aborts`/`scanned`のみ）。`pending`が`false`のままなら`takeFollowUp`が常に`undefined`でフォローアップが送られずGoalを外すが、現行検査は緑のまま。 / left: `takeFollowUp`のテストが間接的に保証する。`observe`が`pending:false`のままなら`takeFollowUp(second.guard)`が`undefined`を返してテストが落ちる。boolの直接表明は同じ振る舞いの繰り返しになる。
3. 272 / Work Review Round 1 / `.pi/extensions/thinking-scrub/index.test.ts:497` — `toMatchObject`が`content`を見ないため、誤った文言（空文字・旧見本付き・思考継続の誘い）を送っても緑のまま。2 回目の`settled`が 1 件で止まることは見るが、内容の正しさは確かめない。 / left: 内容の表明は定数とADRの`Details`を写すだけになり、同語反復になるためテストしない。2 回目の`settled`が 1 件で止まることと`Always`の読み合わせで担保する。

## Triage

- 1: dropped (ADR 01, Unit.thinking-scrub)
  - Fact: `FOLLOWUP_TEXT` の内容を確かめるテストがなく、`index.test.ts` は `customType` と `display` だけを見る。誤った文言でも緑になる。
  - Why: 固定文言は ADR の `Details` そのもので、定数と期待値の写経は同語反復になる。オーナーの判断でテストを設けず、`Always` の読み合わせで ADR の `Details` と突き合わせて確認する。
  - Then: なし
- 2: _ex-change_ (ADR 01, Unit.thinking-scrub): done e565b255
  - Fact: `observe` の stop が `pending: true` を立てることがテスト名に表れておらず、状態が読み取れない。振る舞い自体は `takeFollowUp` のテストが覆う。
  - Why: 停止がどの状態を立てるかをテスト名に書くと、直接の bool 表明を足さずにテストの意図が伝わる。
  - Then: `guard.test.ts` の `observe` の停止テスト名を `stop になり、pending が立つ` に変える。
- 3: dropped (ADR 01, Unit.thinking-scrub)
  - Fact: `index.test.ts:497` の `toMatchObject` が `content` を見ないため、誤った文言でも緑になる。
  - Why: 1 と同じ。内容の表明は定数と ADR の `Details` を写すだけになり、同語反復になる。2 回目の `settled` が 1 件で止まることと `Always` の読み合わせで担保する。
  - Then: なし

## Verified

### thinking-scrub

- Plans:
  - `interrupt-message`
- Result: OK
- Change: OK
- Fixed: なし
