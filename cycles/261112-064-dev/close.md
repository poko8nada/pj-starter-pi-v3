# Close 064

## Collected

### 01 adr-type (ADR 01, 02)

1. 754 / Slice 2 (スクリプトの骨組みに Type と `_omission_` を出す) / `pnpm test:related` で 11 件失敗する。旧テストの inline ADR に `Type:` 行がなく、`checkEntry` が `Type is missing` を返すため。 / left: スライス 6 でテストを新しい形に合わせるときに解消する。このスライスの作業では旧テストを変えない。
2. 769 / Slice 4 (スクリプトの引数と本文の書き換え) / `pnpm test:related` で 13 件失敗する。スライス 2 からの 11 件（Type のない旧 fixture）に加え、`parseArgs` の `--add`/`--set` 形状変更の 2 件が旧期待値のまま残るため。 / left: スライス 6 でテストを新しい形に合わせるときに解消する。このスライスの作業ではテストを変えない。
3. 784 / Slice 6 (テストを新しい形に合わせる) / スライス 2・スライス 4 に残っていた 13 件の失敗は、このスライスの作業で解消した。`pnpm test:run` で 828 件のテストすべてが通る。
4. 791 / Cleanup: Type テストの抜けを埋める / `--set` の Type なしテストが Full 起点のため、Type 書き換えを見逃す構成になっていた。起点を Simple に直し、Type と Scope の保持を確かめるようにした。CLI の `--add Simple` 経路にはコミット済みのテストがなく、使い捨てスクリプトでの確認にとどまっていた。`--add 二 Simple` のテストを追加し、Type・`_omission_`・affected の題名を確かめるようにした。既存のテストはすべて維持し、削除したものはない。
5. 813 / Work Review Round 1 / `.pi/skills/adr/scripts/cycle.mjs:146` — Type 行を持たない旧エントリに `--set <NN> <title> <Type>` を実行すると `replace(/^Type: .*$/mu, ...)` が一致せず何も置き換えないため、Scope と Details だけが新しい Type に対応する形になる。旧エントリの移行をこの振る舞いでよいかについて、オーナーの判断が必要だ。
6. 818 / Work Review Round 2 / `.pi/skills/adr/scripts/adr.mjs:202` — 直っている。JSDoc の冒頭（203行）が `Type:` 行の有無・値と Type に応じた `Scope`・`#### Details` の `_omission_` 検査について説明し、実装の有無検査（218行）・値検査（219-221行）・Simple/Full 分岐（222-236行）と一致しているため。理由：指摘内容の古さ（C/F 参照検査のみの説明）が解消されている。
7. 819 / Work Review Round 2 / `.pi/skills/adr/scripts/index.test.ts:346` — 直っている。`decision` 文字列に `#### Details` を埋め込まず（349行は Add/Policy のみ）、フェンスは `entry()` の `{ details }` 引数で渡し（353行）、helper が単一の `#### Details` 見出しを付与する（298-300行）ため、重複がなく、アサート（355行）も残っている。理由：指摘の二重見出しの構成が単一の見出しに直っている。
8. 822 / Work Review Round 2 / `.pi/skills/adr/scripts/index.mjs:128` — 直っている。新規作成分岐が `adrSkeleton(nnn, add.title, add.type)` に Type を渡し（128行）、CLI テスト `--add はサイクルがなければ Simple で新規作成する`（660行）が新規 `adr.md` の `Type: _Simple_`・`Scope` と `Details` の `_omission_`（671-673行）と affected の題名（674行）を確かめるため。理由：指摘の未検証部分（新規作成）が検査で補われている。
9. 825 / Work Review Round 2 / `.pi/skills/adr/scripts/index.test.ts:475`（Round 1 の 472 行と同名のテスト） — 直っている。Full テストが `Type: _Full_`（478行）・`- In:`（479行）に加え ` ```text`（480行）を確かめ、`Details` の復元が壊れるとテストが失敗するため。理由：不足していた検証（`Details` の確認）が追加されている。
10. 834 / Acceptance / `cycle.mjs:146` — Type 行のない旧エントリに Type 付き `--set` を実行した場合、Type 行は追加されず Scope と Details だけが変わる。オーナーの判断が必要だ。

## Triage

- 1: dropped
  - Fact: `--set <NN> <title> <Type>` を Type 行のない旧エントリに対して実行しても `/^Type: .*$/mu` が一致せず何も置き換えないため、`Scope` と `#### Details` だけが新しい Type に対応する形に変わる。Type 行は追加されない。
  - Why: 旧エントリは `--set` の対象にならない。開いているサイクルのエントリは scaffold が Type 行を書く。Type 行のないエントリは手で壊した場合だけで、`--check` が「Type is missing」を返す。`--set` に修復の責務を足す必要はない。
  - Then: なし

## Verified

### Unit.adr-skill

- Plans:
  - `adr-type`
- Result: OK
- Change: OK
- Fixed: なし

### Unit.plan-skill

- Plans:
  - `readers-simple`
- Result: OK
- Change: OK
- Fixed: なし

### Unit.close-skill

- Plans:
  - `readers-simple`
- Result: OK
- Change: OK
- Fixed: なし

### Unit.yolo-skill

- Plans:
  - `readers-simple`
- Result: OK
- Change: OK
- Fixed: なし
