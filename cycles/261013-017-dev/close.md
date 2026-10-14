# Close 017

## Collected

### product-ready-list (ADR 02 / Scope `Unit.product-ready`)

1. 183 / Review Round 1 / `scripts/product-ready/cli.mjs:2` の `PruneArgs` という型名が残る。prune-* 削除後の入口は product-ready だが、prune＝消す物の意味は変わらず、plan の Steps も改名を求めないため Stale とはしない。
   - Doing: slice 2 で `prune-*.mjs` を消し、`cli.mjs` を product-ready の入口に書き換えていた
   - Left: plan の Steps は関数の変更だけで、型名の改名を求めていない
   - Cost: 消えた概念の名前が型に残り、読む人が「prune とは」を探す
2. 184 / Review Round 1 / `scripts/product-ready/index.test.ts:54` の表示テストは `001-a` だけを見て `002-b` と `harness-scopes.json` の行を見ない。`targets.test.ts:69` が plan の両フォルダを持ち、`cli.test.ts:20` が `planLines` の exact を持つため、suite では覆う。単体代表とみて Gaps/Unproven とはしない。
   - Doing: 同じ slice で `index.test.ts` を主に書き直していた
   - Left: 表示のテストは代表 1 件に絞った（全行は `targets.test.ts` と `cli.test.ts` が持つ）
   - Cost: 表示の欠けはこのテストでは見えない。他のテストが同じ範囲を持つので穴ではない
3. 185 / Review Round 1 / `scripts/product-ready/index.test.ts:165` の2回目 `--run` は `no tests` / `no cycles` だけを見て `no harness` を見ない。`index.test.ts:129` の空 root が3行を持ち、`index.test.ts:97` が harness 削除を持つため、suite では覆う。単体不足とみて finding とはしない。
   - Doing: 同じ slice で 2 回目の `--run` を足していた
   - Left: `no tests` / `no cycles` だけを見た（`no harness` は空 root と harness 削除のテストが持つ）
   - Cost: 3 種のうち 1 種の空表示がこのテストでは見えない
4. 186 / Review Round 1 / `scripts/product-ready/targets.test.ts:144` の昇順テストは FS の `readdir` 順に依存する。順序が既に昇順の FS では sort 撤去でも緑になる可能性があるが、plan の要求は昇順であること自体で、テストは昇順をexact と `toSorted` の両方で見る。FS 依存の弱さとみて finding とはしない。
   - Doing: slice 1 で `plan` の昇順を確かめていた
   - Left: `readdir` の順に依存する（FS が昇順なら sort 撤去でも緑）
   - Cost: 昇順の保証が FS 任せ。`toSorted` の exact が同じ性質を見ている
5. 193 / Acceptance / `scripts/product-ready/targets.mjs:125` の `void root;` — `remove` の第 1 引数 `root` は使われていない。plan の `Types` が `remove(root, plan)` と書くため残した物で、`plan` と対にする意図は読めるが、`void` で黙らせている形は残る。
   - Doing: slice 1 で `remove(root, entries)` を plan の `Types` どおりに書いていた
   - Left: 第 1 引数は使わないが `plan` と対にするため署名を変えず、`void root;` で黙らせた
   - Cost: 使われない引数と `void` の理由を読む人が探す
6. 194 / Acceptance / `scripts/product-ready/targets.mjs:39-51,73-77` の `walk` は `{ label: '', at: '', path }` を積んで呼び側で書き直す。動くが、`walk` がパスだけを返す形の方が短い。
   - Doing: 同じ slice の `plan` の walk
   - Left: 動く形を優先し、空の `{ label: '', at: '', path }` を積んで呼び側で書き直す形にした
   - Cost: 一時的な空の値が型に現れる。短く書ける

### ex-product-ready-shape (ADR 02 / Scope `Unit.product-ready`)

7. 66 / Review Round 1 / `cycles/261013-017-dev/adr.md:49` の `remove(root, plan)` の書き方は残る。芯が `plan` と `remove` の2つである決定自体は保たれるし、前計画 `cycles/261013-017-dev/plan/product-ready-list.md:185` が archive・ADR の記録だけを Stale としないと決めたため、finding とはしない。
   - Doing: ex- plan の slice で `remove` の署名を直していた
   - Left: ADR は決定の記録なので、この計画では触らない
   - Cost: `adr.md:49` の `remove(root, plan)` が実装と食い違って見える
8. 67 / Review Round 1 / `cycles/261013-017-dev/plan/product-ready-list.md:46,62,106` の `remove(root, plan)` と `:176` の `PruneArgs` 残存メモは現計画の Types/Steps に置き換えられた履歴で、live の `scripts/product-ready/cli.mjs:2`・`scripts/product-ready/targets.mjs:105` は更新済みのため、Stale とはしない。
   - Doing: 同じ slice
   - Left: 前の plan md の旧署名のメモは履歴で、live ではない
   - Cost: 読む人が `product-ready-list.md:46,62,106` を現行と誤解する
9. 68 / Review Round 1 / `scripts/product-ready/cli.mjs:2` を `PruneArgs` に全戻ししても `pnpm typecheck` は緑のままになるが、改名は振る舞いを変えない形の変更で plan が `_no case_` と決めた範囲のため、Unproven とはしない。
   - Doing: 同じ slice で `PruneArgs` を `Args` に改名
   - Left: 型名は振る舞いを変えないので、plan が `_no case_` と決めた
   - Cost: 改名を戻しても typecheck は緑。テストでは見えない
10. 69 / Review Round 1 / `void root;` と第1引数を両方戻しても `pnpm lint` 単体は緑になるが、`scripts/product-ready/targets.test.ts:209,211,219` が赤になるため suite では覆う。単体チェックの弱さとみて finding とはしない。

- Doing: 同じ slice で `void root;` を消した
- Left: lint 単体では見えないが、suite の `targets.test.ts` が赤になる
- Cost: lint だけを信じると、この形の崩れは見えない

11. 70 / Review Round 1 / `scripts/product-ready/targets.mjs:38-51` の walk を旧形（placeholder 積み＋呼び側書き直し）に戻しても `plan` の出力は同じでテストは緑のままだが、振る舞い不変を plan が `_no case_` と決めた範囲のため、Unproven とはしない。

- Doing: 同じ slice で walk の形を変えた
- Left: 旧形に戻しても出力は同じでテストは緑
- Cost: 形の変更はテストで守られていない（振る舞い不変のため）

## Triage

- 1: ex-plan ex-product-ready-shape (Unit.product-ready): 消えた概念の名前が型に残る。同じ所の 3 件を 1 つの plan でまとめて直す — done 8cde696
- 2: dropped (Unit.product-ready): レビュアーが他のテストで覆っていることを確かめている。テストを締めるのは次のサイクルでも同じ
- 3: dropped (Unit.product-ready): 同上（`no harness` の空表示）
- 4: dropped (Unit.product-ready): 同上（FS の順への依存）
- 5: ex-plan ex-product-ready-shape (Unit.product-ready): 使われない第 1 引数。`remove` の署名を素直にする — done 8cde696
- 6: ex-plan ex-product-ready-shape (Unit.product-ready): `walk` が空の値を積んで呼び側で書き直す形。短く書ける — done 8cde696
- 7: dropped (Unit.product-ready): ADR は決定の記録。live のコードは直っている
- 8: dropped (Unit.product-ready): 前の plan md はその時の記録。同上
- 9: dropped (Unit.product-ready): 型名は振る舞いを変えない。テストの強さの話
- 10: dropped (Unit.product-ready): lint 単体の弱さの話。suite が赤にする
- 11: dropped (Unit.product-ready): 振る舞い不変の形の話。テストで守られないのは同じ
