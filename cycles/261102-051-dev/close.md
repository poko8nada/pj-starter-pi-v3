# Close 051

## Collected

### ja-check (ADR 01, 02)

1. 145 / Work Review Round 1 / Steps (`cycles/261102-051-dev/plan/ja-check.md:82,86-88`) は落とした4件をまだ列挙する。`Cleanup` の理由付けが正しければ Steps 側を直すかは close の判断に残る。 / left: Steps は slice 実行時の仕様記録であり、Cleanup で削除理由を残しているため直さない。履歴を書き換えると slice と Cleanup の対応が追えなくなるため、close の判断に残す。

### ex-ja-output (ADR 01)

2. 104 / Work Review Round 1 / cycles/261102-051-dev/adr.md:50 と cycles/261102-051-dev/design.md:63 が旧日本語集計行 `ja-check: <n> ファイル、error <n> 件、warn <n> 件` の記述のまま残るが、履歴的記録か生きた仕様か判断できず finding にしなかった。 / left: 採用済みの記録は履歴のため直さない。出力文面の変更はcloseのトリアージに回し、`adr.md` と `design.md` は触らない。

## Triage

- 1: dropped (ADR 01, Unit.japanese-check)
  - Fact: `plan/ja-check.md` の `Steps` の 3 が 18 件を列挙しているが、`Cleanup` でのテストの整理で 4 件を落として 15 件にし、削除の理由を `Cleanup` に残している。`Steps` は Slice 実行時の仕様記録であり、現行のテストは緑である。
  - Why: `Steps` を書き換えると Slice の実行記録と `Cleanup` の対応関係が追えなくなる。テストの内容は正しいため、`Steps` を直す手間より残す負担の方が軽い。
  - Then: なし
- 2: ex-plan ex-ja-output (ADR 01, Unit.japanese-check): done 125a930
  - Fact: 出力は該当行と集計行だけであり、報告の宣言、warn と error の意味とコミットの帰結、置き換え先がアイデアであること、該当箇所の前後、0 行時の明示がない。オーナーが検証で指摘した。
  - Why: 出力が自足的でなければ、初めて見た作業者は対応を判断できない。このサイクルの関心であり、整形と 15 件のテストに収まる分量である。
  - Then: 冒頭の説明、アイデアの明示、該当箇所の前後、報告の文言、0 行時の明示を足す方針の計画を立てる。振る舞いと終了コードは変えない。
- 3: ex-plan ex-ja-test-names (ADR 01, Unit.japanese-check): done 5c844b5
  - Fact: `scripts/checks/ja-check.test.ts` の `it` の名称 15 件が英語であり、既存のテスト（`typecheck.test.ts` など）の日本語の名称とそろっていない。オーナーが今後の `ex-` で日本語の名称に直すと決めた。
  - Why: `it` の名称を日本語にそろえることはこのサイクルの関心（050 の語対応表の検査を日本語で読めること）であり、`ex-` 1 件に収まる分量である。
  - Then: `it` の名称だけを日本語の名称に直す方針の計画を立てる。テストの振る舞いは変えない。
- 4: dropped (ADR 01, Unit.japanese-check)
  - Fact: `adr.md` と `design.md` に旧日本語集計行の記述が残るが、採用済みの記録は履歴であり、出力の仕様は実装とテストと計画が持つ。
  - Why: 採用済みの記録を書き換えると履歴が崩れる。現行の仕様は実装にあるため、直す手間より残す負担の方が軽い。
  - Then: なし

## Verified

### Unit.japanese-check

- Plans:
  - `ja-check`
  - `ja-check-hook`
  - `ex-ja-test-names`
  - `ex-ja-output`
- Result: OK — md・コード・テストの混在実行の出力をオーナーが見て確認した。

### Unit.lefthook-gate

- Plans:
  - `ja-check-hook`
- Result: OK — ドライランの赤（`雛形` で終了コード 1）と緑（`骨` で終了コード 0）をオーナーが見て確認した。
