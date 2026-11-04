# PLAN `exception-words`

- No: 02
- Place: base
- Boundary Plans: `exception-shape`（`exception` の空の配列と 3 欄の検証を先に作る）

## Files

```text
scripts/
  checks/
    ja-check.json      update
README.md              update
README.ja.md           update
```

## Slices

## 1.語の選定と記入

### Types

なし

### Steps

1. `scripts/checks/ja-check.json`:
   - update: 先行の plan が作った空の `exception` の配列に、ヒット位置を含む漢字の連続に後続のひらがなを加えた並びをすべて集め、禁止語そのものになる並びと助詞で終わる句を除いた候補を、禁止語ごとに分けて出現数の多い順にオーナーに示し、採用する語の OK を得てから、五十音順に 1 行に 1 語ずつ書き込む（どの禁止語も含まない例外は、抑えようとした警告が残るため誤りとしない）。

### Verify

- Always:
  - `pnpm test:run`（このスライスに関連するテストはなく、実際の設定の語はテストの対象外である）。
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format` を通したあと `git diff scripts/checks/ja-check.json` を読み、`exception` の要素が消えず、1 行 1 語のままであることを確かめる。
  - `pnpm format:check`
  - 変更した全ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added:
  - base: オーナーが、禁止語ごとに分けた候補の一覧と、`exception` に書き込んだ語を読み、採用する語の OK を返す。
  - other: `node scripts/checks/ja-check.mjs $(git ls-files)` を`exception` への語の書き込み前後で実行し、サマリー行の `error` と `warn` の合計が書き込み前の合計より少なくなることを確かめる。

## 2.文書

### Types

なし

### Steps

1. `README.md`:
   - update: `exception` の欄の説明に、`exception` に載った語のうち 3 語を例に挙げ、採用した語は `error` と `warn` のどちらでも報告されないことを添える。
2. `README.ja.md`:
   - update: `exception` の欄の説明に、`README.md` と同じ 3 語を例に挙げ、`README.md` と同じ説明を添える。

### Verify

- Always:
  - `pnpm test:run`（このスライスに関連するテストはない）。
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `README.md` と `README.ja.md` の `exception` の欄の説明に載る語を、`grep -rnF` で `scripts/checks/ja-check.json` の中で探し、すべて見つかることを確かめる。
  - 変更した全ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added:
  - base: オーナーが、`exception` に載った語と `README.md` と `README.ja.md` の例を読み、例が `exception` に設定した語から選ばれていることと文面を確かめ、OK を返す。

## Notes

### Slice 1: 語の選定と記入

- Findings: なし
- Unplanned: なし
- Commit: 7854a36 base(exception-words): add exception words
- Stopped:

### Slice 2: 文書

- Findings: なし
- Unplanned: なし
- Commit: 7094cda base(exception-words): document exception examples
- Stopped:

## Work Review

### Round 1

- Stale: なし — 差分が触れた語の説明は README.md:45 と README.ja.md:45 で更新済みであり、scripts/checks/ja-check.test.ts:6 のコメントと scripts/checks/ja-check.mjs:90 の判定説明は判定 logic が不変のため古くなっていない。テストの仮設定（scripts/checks/ja-check.test.ts:62）は実設定を読まないため実語の追加で古くならない。
- Unlisted: なし — git diff 477a597..HEAD の変更は scripts/checks/ja-check.json と README.md と README.ja.md と plan md の記録だけであり、前者 3 件は cycles/261104-054-feat-ja-check-update/plan/exception-words.md:7 の Files がすべて名指ししている。
- Gaps: なし — 語の選定と抑止効果は cycles/261104-054-feat-ja-check-update/plan/exception-words.md:39 の Added が担い、例の選定は cycles/261104-054-feat-ja-check-update/plan/exception-words.md:63 の grep 照合と cycles/261104-054-feat-ja-check-update/plan/exception-words.md:66 のオーナー確認が担うため発見にしない。具体語・五十音順・3 語は plan が決めた値であり、実設定の語は cycles/261104-054-feat-ja-check-update/plan/exception-words.md:33 が対象外と定める。
- Unproven: なし — この plan はテストの Steps を持たず、既存の scripts/checks/ja-check.test.ts:88 などの検証は仮設定で logic を見るため、実語（scripts/checks/ja-check.json:35）を壊しても緑のままなのは cycles/261104-054-feat-ja-check-update/plan/exception-words.md:41 の前後比較に委ねた範囲であり発見にしない。
- Noise: なし — この差分はテストを追加せず Types は cycles/261104-054-feat-ja-check-update/plan/exception-words.md:21 のとおりなしであるため、型や制約が決める重複検査や魔法の数値の事例は生じない。既存テストの直書き語（scripts/checks/ja-check.test.ts:17）は plan が決めた値の再掲であり発見にしない。
- Doubts:
  - cycles/261104-054-feat-ja-check-update/plan/exception-words.md:70 の Notes に Slice 1 の記録しかなく Slice 2 の Commit 7094cda に対応する記録がないため、Slice 2 のオーナー確認の証跡を差分だけでは確かめられなかった。
  - Slice 1 の Added（cycles/261104-054-feat-ja-check-update/plan/exception-words.md:41 の前後比較）の実行出力が Notes に残っていないため、効果の数値を差分だけでは確かめられなかった。

## Acceptance

- Ran:
  - `pnpm test:run` — 64 ファイル、742 件がすべて通過。
  - `pnpm typecheck` — `root: ok`、`.pi: ok`。
  - `pnpm lint` と `pnpm format:check` — 通過。
  - `node scripts/checks/ja-check.mjs $(git ls-files)` を語の書き込み前と後に実行 — 合計 2,069 件（error 750、warn 1,319）から 1,141 件（error 658、warn 483）へ減った。
  - 振る舞いを壊して赤になるかの確認: `exception` から `手順` を外す → warn が 483 件から 797 件へ増え、戻すと 483 件に戻った。
  - 壊したファイルは `git checkout` で戻し、`git status` が plan md の追記だけであることを確かめた。
- Findings: なし
- Doubts: なし
