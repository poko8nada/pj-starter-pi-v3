# PLAN `plan-format-colocation`

- No: 01

## Files

```text
.pi/
  skills/
    plan/
      references/
        format.md      update
```

## Slices

## 1.置き場所の規則

### Types

なし

### Steps

1. `.pi/skills/plan/references/format.md` の `## Files` にある次の 1 行（`:101`）を、下の 6 つの行に置き換える。
   - 今の行: `- A new double or fixture is a file: it goes in the tree, and `test/` is where the doubles live. Say how it behaves when it is run outside its test: refuse, do not hang.`
   - 1 行目: `- A new double or fixture is a file: it sits at the root of the feature whose shape it holds.`
   - 2 行目: `- A fixture that holds a shape the feature does not own — the host, the OS, a format several units share — goes in `test/`.`
   - 3 行目: `- `test/` is shared, not the harness's own: a project may keep its own files there.`
   - 4 行目: `- Name a fixture `<name>.fixture.ts`, wherever it sits. A helper that is not a double keeps its own name.`
   - 5 行目: `- A file in `test/`that a carried test imports is named in`scripts/harness/harness.json`'s `copy`.`
   - 6 行目: `- Say how a fixture behaves when it is run outside its test: refuse, do not hang.`
   - 6 行目は今の行の後半をそのまま残す。ダブルとフィクスチャの外での振る舞いを、失わないため。
   - 1 行は 1 文にする。`## Files` の他の行と同じ調子（英語、`-` の箇条）に合わせる。
2. `.pi/skills/plan/references/format.md` の `## Files` を、足した 6 行の前後で読む。同じことを 2 度書いている行が残っていないか、`test/` の置き場所について食い違う行が残っていないかを見る。

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - other: 新しい 5 つの文が `## Files` にあることを、各文の特徴的な句の `grep` で見る（`sits at the root of the feature`、`goes in `test/``、`is shared, not the harness's own`、`<name>.fixture.ts`、`harness.json`'s `copy`）。古い文（`test/` is where the doubles live）が消えたことは、既定の 5 つ目の `grep` が見る。

## Notes

### Slice 1: 置き場所の規則

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

### Plan review

- `:26` は `## Test cases` の行を置き換えると書いていましたが、`format.md:101` は `## Files` にあります。
  - fixed: `## Files` の `:101` と書き、置き換える行そのものを plan に写した。
- `:27-31` の 5 規則が日本語で、ファイルの英語と調子が合わず、2 文の規則もありました。英語の完成文を与える手順も、言葉と文数を確かめる検査もありませんでした。
  - fixed: 6 つの英語の行を plan にそのまま書き、1 行 1 文にした。6 行目は今の行の後半（外での振る舞い）を残す。
- `:26` の置き換えで、`:101` の後半（テストの外での振る舞い）が失われていました。
  - fixed: 6 行目として残し、`Steps` の 2 で前後を読んで重複と食い違いを見ることにした。
- 足した行が `## Files` の他の行と合っているかを、既定の 5 つが確かめません。
  - fixed: `Verify` の `Added` に `other` を足し、新しい 5 つの文の特徴的な句を `grep` で見ることにした。古い文が消えたことは既定の 5 つ目が見る。
  - left: 文が英語か 1 文かは、`grep` では見ない。レビューの `Noise` と owner の目で見る。

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
