# Close 052

## Collected

### consult-collapse (ADR 01, 02)

3. 214 / Acceptance / `.pi/extensions/consult/index.ts:212` — `registerNotice(pi)` を削除しても自動テストは緑のままである（`index.test.ts` は default export を呼び出さない）。 / left: `ExtensionAPI` のモックを作ると型アサーションが必要になり、lint の `no-unsafe-type-assertion` に引っかかる。配線は1行だけであり、`registerNotice` 自体はテストで確認している。

## Triage

- 3: ex-plan ex-wiring-check (ADR 02, `Unit.subagent-consult`): done b3e7db5
  - Fact: `.pi/extensions/consult/index.test.ts` に、入口を偽の `pi` で呼んで `'consult'` と `renderNotice` の登録を確かめるテストを足した。`registerNotice(pi)` の行を消すと、新しいテストが赤になる。
  - Why: この配線は consult の表示の入口であり、消えると1行表示が静かに効かなくなる。オーナーの目視だけでは、次に消えたときに気づけない。
  - Then: 入口の引数の型は狭めず、偽物の型アサーションに理由を書いた抑制コメントを1箇所だけ置く。テストは関数の同一性で確かめる。

## Verified

### Unit.subagent-consult

- Plans:
  - `consult-collapse`
  - `ex-wiring-check`
- Result: しない — スライス1とスライス2の見た目の確認（1行表示、`ctrl+o`、クリックでの開閉）で、オーナーがすでに機能を確かめているため。
