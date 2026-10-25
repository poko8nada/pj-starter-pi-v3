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

1. `.pi/skills/plan/references/format.md` の `## Files` にある次の 1 行（`:101`）を、下の 7 つの行に置き換える。
   - 今の行: `- A new double or fixture is a file: it goes in the tree, and `test/` is where the doubles live. Say how it behaves when it is run outside its test: refuse, do not hang.`
   - 1 行目: `- A new double or fixture is a file: it sits at the root of the feature whose shape it holds.`
   - 2 行目: `- A fixture that holds a shape the feature does not own — the host, the OS, a format several units share — goes in `test/`.
   - 3 行目: `- `test/` is shared, not the harness's own: a project may keep its own files there.`
   - 4 行目: `- Name a fixture `<name>.fixture.ts`, wherever it sits.`
   - 5 行目: `- A helper that is not a double keeps its own name.`
   - 6 行目: `- A file in `test/`that a carried test imports is named in`scripts/harness/harness.json`'s `copy`.`
   - 7 行目: `- Say how a double or a fixture behaves when it is run outside its test: refuse, do not hang.`
   - 7 行目は今の行の後半を残す。主語を double と fixture の両方にする。
   - 1 行は 1 文にする（`format.md:205` の `One bullet is one sentence.` に合わせる）。`## Files` の他の行と同じ調子（英語、`-` の箇条）に合わせる。
2. `.pi/skills/plan/references/format.md` の `## Files` を、足した 7 行の前後で読む。同じことを 2 度書いている行が残っていないか、`test/` の置き場所について食い違う行が残っていないかを見る。

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - other: 新しい 7 つの文が `## Files` にあることを、各文の特徴的な句の `grep` で見る（`sits at the root of the feature`、`goes in`、`is shared, not the harness's own`、`<name>.fixture.ts`、`A helper that is not a double`、`harness.json`'s `copy`、`Say how a double or a fixture behaves`）。古い文（`test/` is where the doubles live）が消えたことは、既定の 5 つ目の `grep` が見る。

## Notes

### Slice 1: 置き場所の規則

- Findings:
  - なし
- Unplanned:
  - `.pi/skills/plan/references/format.md:105` の 5 行目のバッククォート前後の空白を補い、`test/` that と in `scripts/harness/harness.json` に直した。plan の写しには空白がなく、そのままでは `## Files` の他の行と調子が合わないため、ここで直した。
- Commit: 91a7dd6
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
- `format.md:104` が 2 文でした（`Name a fixture ... wherever it sits. A helper ...`）。`format.md:205` の `One bullet is one sentence.` に反します。
  - fixed: 2 行に分け、全体を 7 行にした。`Added` の `grep` にも `A helper that is not a double` を足した。
- `format.md:106` の主語が `a fixture` に狭まり、旧文の `it`（double と fixture の両方）が指していた double の外での振る舞いが抜けました。
  - fixed: `Say how a double or a fixture behaves when it is run outside its test: refuse, do not hang.` に戻した。
- `Verify` の `Added` が見るのは 5 文だけで、6 行目の有無を区別できませんでした。
  - fixed: 7 文すべての特徴的な句を見る形にし、`Say how a double or a fixture behaves` も足した。

### Round 1

- Stale:
  - なし — `.pi/skills/plan/references/format.md:101-106` の置き換えにより、他の節と食い違う記述は残っておりません。`test/` の置き場所に触れる記述は当該6行のみであることを確認しました。`### Structure` (`format.md:108-114`) は関心の置き場所とテストの隣接を述べており、double・fixture の置き場所とは重なりません。旧文言は `adr.md:8` の経緯説明と plan の写し・検査説明に残るのみであり、歴史的記録として適切です。
- Unlisted:
  - なし — `git diff 7d9e006..HEAD` が触れておりますのは `.pi/skills/plan/references/format.md` の1行から6行への置き換えのみであり、plan の `## Files` が示す `format.md update` の範囲内でございます。5行目の空白補正 (`format.md:105`) も同一ファイル内の調子合わせであり、`## Notes` に `Unplanned` として記録されております。
- Gaps:
  - なし — 本 slice は文書のみの変更であり、実行時の振る舞いはございません。6行の文言はいずれも `Steps` で定められた決定値であり、定義により `Gaps` の対象外です。`Steps` の2の前後読みにつきましても、重複・食い違いは見当たりませんでした。
- Unproven:
  - なし — 本 slice にテストファイルはございません (`Types` は `なし`)。`Verify` の `Added` の `grep` は文言の有無を見る shell の確認であり、外したときに緑のまま残るテストにはあたりません。
- Noise:
  - `.pi/skills/plan/references/format.md:104` は2文になっております (`Name a fixture `<name>.fixture.ts`, wherever it sits.` と `A helper that is not a double keeps its own name.`)。plan の `Steps` が求める `1行は1文` および `format.md:205` の `One bullet is one sentence.` を満たしておりません。なお、当該2文は plan の `Steps` の4行目 (`plan-format-colocation.md:30`) の写しのままであり、差分が `Steps` の例文から外れたものではございません。英語・`-` 箇条の調子自体は `## Files` の他の行と合っております。
    - fixed: 2 文の 1 行を分け、`Name a fixture ...` と `A helper that is not a double ...` の 2 行にし、`One bullet is one sentence.` に合わせた（`format.md:104-105`）。
- Doubts:
  - `.pi/skills/plan/references/format.md:106` では旧文の `Say how it behaves ...` が `Say how a fixture behaves ...` となり、主語が `double or fixture` から `fixture` のみに狭まっております。`Steps` の理由書きはダブルとフィクスチャの振る舞いを失わないためとしておりますので、意図的な狭め化なのか、`a double or fixture` とすべきなのかが判然といたしません。差分は `Steps` の例文通りであり、影響のご判断を残すため疑義といたします。
    - fixed: 最終行を `Say how a double or a fixture behaves ...` に戻し、ダブルの外での振る舞いを失わないようにした（`format.md:107`）。
  - `Verify` の `Added` は新しい5文の特徴句のみを `grep` しており、6行目 (`format.md:106`、`refuse, do not hang` を含む行) の有無や `it` から `a fixture` への言い換えを区別できません。6行目を削除しても5つの `grep` は緑のままでございます。文言の決定値は `Gaps` の対象外との定義により、疑義として残します。
    - fixed: `Verify` の `Added` に `A helper that is not a double` と `Say how a double or a fixture behaves` の `grep` を足し、7 行すべての有無を見るようにした。

### Round 2

- Stale:
  - なし — 今回は `### Round 1` の `fixed:` 3 件のみを確認対象といたしますため、`Stale` には `fixed:` がございません。
- Unlisted:
  - なし — 同上の理由により、`Unlisted` には `fixed:` がございません。
- Gaps:
  - なし — 同上の理由により、`Gaps` には `fixed:` がございません。
- Unproven:
  - なし — 同上の理由により、`Unproven` には `fixed:` がございません。
- Noise:
  - 修正を確認いたしました — `### Round 1` の `Noise` の `fixed:`（4 行目の 1 文化）は直っております。`git diff 7d9e006..HEAD -- .pi/skills/plan/references/format.md` では旧 1 行が 7 行に置き換わっており、現行 `format.md:104` が `Name a fixture \`<name>.fixture.ts\`, wherever it sits.`の 1 文、現行`format.md:105`が`A helper that is not a double keeps its own name.` の 1 文で、各箇条は 1 文となっております。`format.md:205`の`One bullet is one sentence.` に合っております。
- Doubts:
  - 修正を確認いたしました — `Doubts` 1 件目の `fixed:`（最終行の主語）は直っております。現行 `format.md:107` は `Say how a double or a fixture behaves when it is run outside its test: refuse, do not hang.` であり、`double` が主語に戻っております。`Steps` の理由書き（ダブルとフィクスチャの振る舞いを失わない）と整合しております。
  - 修正を確認いたしました — `Doubts` 2 件目の `fixed:`（`Added` の `grep` の網羅）は直っております。現行 plan `:42` の `Added` は 7 つの特徴句（`sits at the root of the feature`、`goes in test/`、`is shared, not the harness's own`、`\`<name>.fixture.ts\``、`A helper that is not a double`、`harness.json's copy`、`Say how a double or a fixture behaves`）を `grep`で見るとしており、現行`format.md:101-107` の 7 行に 1 対 1 で対応しております。`git diff 7d9e006..HEAD` の plan 差分でも 5 文から 7 文への書き換えを確認いたしました。
  - Doubts: なし — 上記 3 件のほか、所見に至らない疑義はございません。

## Acceptance

- Ran:
  - `pnpm test:run` → 54 ファイル / 767 ケース緑
  - `pnpm typecheck` → root: ok、`.pi`: ok
  - `pnpm lint` → 緑
  - `pnpm format:check` → 1 回目は plan md の整形で赤だった。`pnpm format` で直し、もう一度通して緑。
  - 「振る舞いを壊す」を 1 件試した。
    - `format.md` から `A helper that is not a double keeps its own name.` の行を消す → `Added` の `grep -c` が 0 になり、検査が赤。戻して 1 を確認。
- Findings: なし
- Doubts: なし
