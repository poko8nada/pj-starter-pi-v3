# PLAN `consult-research-write`

- No: 03
- Place: base
- Boundary Plans: `adr-affected` (02) は、この plan が足す `research` ロールの書き込み用のツールと `paths`（`cycles/*/affected.md`）で、`affected.md` を書く。

## Files

```text
.pi/extensions/consult/
  types.json              update
  README.md               update
  sub/
    guard.test.ts         update
```

## Slices

## 1.research ロールの書き込みの許可

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/consult/types.json`:
   - update: `research` の `tools` に `edit`、`quick_edit`、`target_edit`、`write` を足す。
   - update: `research` の `paths` を `["cycles/*/affected.md"]` にする。

### Verify

- Always:
  - `pnpm test:run .pi/extensions/consult`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `test "$(grep -c '"paths": \["cycles/\*/affected.md"\]' .pi/extensions/consult/types.json)" = 1`
  - `test "$(grep -c '^        "edit",$' .pi/extensions/consult/types.json)" = 1`
  - `test "$(grep -c '^        "write"$' .pi/extensions/consult/types.json)" = 1`
- Added: base の見た目: オーナーが `.pi/extensions/consult/types.json` の差分を読み、`research` の `tools` と `paths` が意図どおりであることを確かめ、その OK で閉じる。

## 2.README の Roles の表とテスト

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/consult/README.md`:
   - update: `Roles` の表の `research` の `Tools` に `edit`、`quick_edit`、`target_edit`、`write` を足す。
   - update: `review` の `Tools` に `bash` を足す。
   - update: `proofreader` の `Turns` を `60`、`Output tokens` を `100,000` に直す。
   - update: `trial` の `Turns` を `80` に直す。
2. `.pi/extensions/consult/sub/guard.test.ts`:
   - update: `cycles/261026-042-dev/design.md` のフィクスチャを `cycles/261026-042-dev/affected.md` に置き換える。
   - add: (happy) `cycles/010/affected.md` が `cycles/*/affected.md` に許される → `pathAllowed` が `true` を返す。
   - add: (happy) `write` に `cycles/010/affected.md` を渡す → `judgeToolCall` が `{}` を返す。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/sub/guard.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -n 'design.md' .pi/extensions/consult/sub/guard.test.ts`
  - `test "$(grep -c "pathAllowed('cycles/010/affected.md', '/w', \['cycles/\*/affected.md'\])" .pi/extensions/consult/sub/guard.test.ts)" = 1`
  - `test "$(grep -c "judgeToolCall('write', { path: 'cycles/010/affected.md'" .pi/extensions/consult/sub/guard.test.ts)" = 1`
  - `test "$(grep -c 'cycles/261026-042-dev/affected.md' .pi/extensions/consult/sub/guard.test.ts)" = 1`
- Added: base の見た目: オーナーが `.pi/extensions/consult/README.md` と `.pi/extensions/consult/sub/guard.test.ts` の差分を読み、`Roles` の表と許可のテストが意図どおりであることを確かめ、その OK で閉じる。

## Notes

### Slice 1: research ロールの書き込みの許可

- Findings: なし
- Unplanned: `pnpm format:check` が `types.json` の整形を求めたため、`pnpm format` で `tools` の配列を複数行に整形した。`types.json` の既存の `role` の文が ja-check の `error` に当たりコミットが止まったため、`review` の語を「理由」に、`proofreader` の例をカタカナの推奨形に直した。
- Commit: 0d90638
- Stopped: なし

### Slice 2: README の Roles の表とテスト

- Findings: なし
- Unplanned: `pnpm format` で `README.md` の表の桁と `guard.test.ts` のインデントを揃えた。
- Commit: 2a578f0
- Stopped: なし

### Cleanup: なし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale: なし — researchを読取専用と書く文書・コメント・テストは残らず、`research`に触れるのは役名だけの記述（`run/run.ts:15`、`index.ts:231`）のみで、`design.md`への残存参照は履歴の記録かadrの記述のみであり、今回の変更で陳腐化して直していない箇所はないことを確かめた。
- Unlisted: なし — `git diff 65a31f4..HEAD --stat`が4件（`types.json`、`README.md`、`guard.test.ts`、当plan mdの`## Notes`）のみで、実質の3件はすべて`## Files`の3件と一致することを確かめた。
- Gaps: なし — adr `## 03`の`Adopted`（researchのtools 4件追加、`paths`固定、READMEのresearch/tools・review/bash・proofreader/trial上限の`types.json`合わせ、guard.testへの許可テスト追加と`design.md`→`affected.md`置換）と`Scope`の`in`（behaviour/format/prose/security）はいずれもSlice 1・2の`Steps`が担い、`Verify`のgrepと目視も対応することを確かめた。
- Unproven:
  - cycles/261103-053-dev/plan/consult-research-write.md:40 — `test "$(grep -c '"paths": \["cycles/\*/affected.md"\]' ...)" = 1`は`paths`だけを見て`tools`を見ないため、`tools`の4件（`edit`・`quick_edit`・`target_edit`・`write`）を消して`paths`だけ残しても緑のまま。理由: `Steps`はtools追加を求めるが、自動検査はpathsの存在のみ断言し、`pnpm test:run`も実物の`types.json`を読まない（`policy/types.test.ts`はフィクスチャ、`guard.test.ts`は直書きの`limits`）ためtoolsの回帰を検出できず、`Added`の目視だけが頼り。
  - cycles/261103-053-dev/plan/consult-research-write.md:70 — `! grep -n 'design.md' .pi/extensions/consult/sub/guard.test.ts`は不在だけを見て存在を見ないため、`design.md`行を消すだけで`affected.md`への置換や2件の追加（`pathAllowed`と`judgeToolCall`）を足さなくても緑のまま。理由: `Steps`は置換と追加を求めるが、自動検査は`design.md`の不在のみ断言し、`pnpm test:related`も件数が減っても通るため追加の回帰を検出できず、`Added`の目視だけが頼り。
- Noise:
  - .pi/extensions/consult/types.json:40 — `review`の`role`文の語の「理由」への変更は、`Steps`にもadr `## 03`の`Adopted`・`Scope`にもない。理由: 計画が決めたのは`types.json`の`research`の`tools`・`paths`とREADME表の`types.json`合わせであり、`review`のrole文の言換えは含まれず、`## Notes`のja-check報告があっても計画外の変更である。
  - .pi/extensions/consult/types.json:55 — `proofreader`の`role`文の例示のカタカナ化（`root`等の漢字の削除とカタカナ併記化）は、`Steps`にもadr `## 03`の`Adopted`・`Scope`にもない。理由: 同上、計画が決めたのはREADME表の上限合わせであり、`proofreader`のrole文の書き換えは含まれず、`## Notes`のja-check報告があっても計画外の変更である。
- Doubts: なし — `## Notes`の`Unplanned`は上記Noiseの2件と整形のみであり、所見に至らない疑義やfindingにしない記録は残らないことを確かめた。
- fixed: cycles/261103-053-dev/plan/consult-research-write.md:40 — slice 1 の `Verify` に、`research` の `tools` が `edit`、`quick_edit`、`target_edit`、`write` を持つことの `grep` を足した。
- fixed: cycles/261103-053-dev/plan/consult-research-write.md:70 — slice 2 の `Verify` に、`affected.md` のテストが3行あることの `grep` を足した。
- left: .pi/extensions/consult/types.json:40 — `review` の `role` の語の変更は、ja-check の既存の `error` を消すためで、slice 1 の `Unplanned` に記録した。
- left: .pi/extensions/consult/types.json:55 — `proofreader` の `role` の例の変更は、ja-check の既存の `error` を消すためで、slice 1 の `Unplanned` に記録した。

### Round 2

- fixed: cycles/261103-053-dev/plan/consult-research-write.md:40 — まだ誤り。41行目の `test "$(grep -c '"tools": \["read".*"write"\]' ...)" = 1` は `edit`・`quick_edit`・`target_edit` に言及せず `read`〜`write` の部分一致のみで、`research` への限定もない。理由: 現 `.pi/extensions/consult/types.json` は `research` の `tools` が複数行（9〜20行目）のため単行 grep は `research` に当たらず、実際に数えるのは `proofreader` の単行（49行目）のみで計1となり緑になる。`research` の4件を消しても緑のままで、逆に `research` を単行の正形に戻すと計2となり赤になるため、`Steps` の tools 追加の回帰を検出できない。
- fixed: cycles/261103-053-dev/plan/consult-research-write.md:70 — まだ不足。72行目の `test "$(grep -c 'affected.md' ...)" -ge 3` は文字列を含む行数を数えるだけで、テストのアサーション（`pathAllowed` の `true`、`judgeToolCall` の `{}`、置換先 `cycles/261026-042-dev/affected.md`）を断言しない。理由: コメント3行や同一行の複写でも緑になり、`pnpm test:related` も件数減で通るため、追加2件を消してコメントで代替する回帰を検出できず、`Added` の目視だけが頼りの状態は変わらない。
- fixed: cycles/261103-053-dev/plan/consult-research-write.md:40 — `research` の `tools` の複数行に合わせ、`edit` と `write` の行を数える2つの `grep` に直した。
- fixed: cycles/261103-053-dev/plan/consult-research-write.md:70 — `pathAllowed`、`judgeToolCall`、置換先の3つを数える `grep` に直した。

## Acceptance

- Ran: `pnpm test:run`（64ファイル、727テスト）、`pnpm typecheck`（root と .pi）、`pnpm lint`、`pnpm format:check`、`paths`・`edit`・`write`・`design.md` の不在・`pathAllowed`・`judgeToolCall`・置換先の7つの `grep`、`types.json` の `paths` 行と `guard.test.ts` の `pathAllowed` 行を外して2つの検査が赤になることを確認して戻した、オーナーの base の確認（スライス1と2）。
- Findings: なし
- Doubts: なし
