# PLAN `starter-readme`

- No: 02

## Files

```text
README.md                update
README.ja.md             update
rules/
  readme.format.md
.github/
  workflows/
    pullfrog.yml
lefthook.yaml
package.json
.pi/
  skills/
    adr/
      SKILL.md
    close/
      SKILL.md
    design/
      SKILL.md
    plan/
      SKILL.md
    work/
      SKILL.md
    yolo/
      SKILL.md
```

## Slices

## 1.2 枚の README

### Types

なし

### Steps

1. `README.md`:
   - 見出しを `design.md` の `starter-readme` の `Goal` の 1 行目にし、`## What is in it`、`## Getting started`、`## Checks`、`## Harness`、`## Cycle` の本文を `Goal` の 4 行目から 7 行目に合わせ、`## Contributing` に commit と push の検査と commit の前の 3 つのコマンドを書き、`## License` に `UNLICENSED` の 1 語だけを置き、言語のリンクの行を短い説明の次の行に残す。
     - Outside: `GitHub Actions`。バッジの画像は `https://github.com/poko8nada/pj-starter-pi-v3/actions/workflows/pullfrog.yml/badge.svg` を使う。ワークフローは dispatch だけで走るので、画像は `no status` と読める。
     - Outside: `TypeScript`。バッジの画像は `https://img.shields.io/badge/TypeScript-7.0.2-3178C6` を使う。版は `package.json:29` の `^7.0.2` と一致させる。
2. `README.ja.md`:
   - 同じ 8 行を日本語で持ち、見出しを `Goal` の 2 行目にし、本文を 1 つ目のファイルと同じ内容にし、`## コントリビュート` に同じ検査とコマンドを書き、`## ライセンス` に `UNLICENSED` の 1 語だけを置き、言語のリンクの行を短い説明の次の行に残す。

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - other — 2 枚の見出しを上から順に取り出し、`design.md` の `starter-readme` の `Goal` の 1 行目と 2 行目に一致することを確かめる
  - other — 2 枚のバッジの行から画像の URL を 2 つずつ取り出し、`Steps` の 2 つの URL（Actions の `badge.svg` と `TypeScript-7.0.2` の shields）と 1 つずつ一致し、版が `package.json:29` の `^7.0.2` と一致することを確かめ、バッジの行を丸ごと外した写しでこの検査が赤になることを確かめる
  - other — 言語のリンクの行が両ファイルで短い説明の次の行にあり、行の文言が `日本語: [README.ja.md](README.ja.md)`／`English: [README.md](README.md)` であることを確かめる
  - other — `## What is in it`・`## Getting started`・`## Checks`・`## Harness` の本文を読み、`What is in it` が 8 つの提供物の列、`Getting started` がインストールと最初に動かすところまで、`Checks`・`Harness` がスターター自身の節であること、日本語の 4 節が同内容であることを確かめる
  - other — `## Cycle` と `## サイクル` の 6 行が `adr`、`design`、`plan`、`work`、`close`、`yolo` の順で並び、各行がその `SKILL.md:3` の `description` の内容と合うことを確かめる
  - other — 2 枚の `## Contributing` と `## License` の本文を、`design.md` の `starter-readme` の `Goal` の 7 行目と 8 行目と突き合わせる

## Notes

### Slice 1: 2 枚の README

- Findings: なし
- Unplanned: なし
- Commit: 2e28b0b consult(starter-readme): rewrite two READMEs to harness product format
- Stopped: なし

## Review

### Round 1

- Stale: なし — rules/readme.format.md:5-56、.pi/skills/adr/SKILL.md:3、package.json:29、lefthook.yaml:1-32、.github/workflows/pullfrog.yml:4-5 と突き合わせ、product-ready の検査が一時木を使うことを確かめた。
- Unlisted: なし — 差分は README.md:1 と README.ja.md:1 の更新だけで、残りは作業の記録のコミットであり、Files の update の 2 件に収まる。
- Gaps:
  - 言語のリンクの行（短い説明の次の行）は Steps が両ファイルに求めるのに Added の 4 件が触れず、外したまま緑になる（README.md:7、README.ja.md:7）。
    - fixed: `Verify` の `Added` に言語リンク行の検査を足し、両ファイルの行の文言と位置を読んで緑を確認した。
  - `## What is in it`／`## Getting started`／`## Checks`／`## Harness` の本文は Goal の 4 行目から 7 行目に合わせるのに Added は見出しと `## Cycle` と Contributing／License だけを見て、外れても赤にならない（README.md:9、README.ja.md:9）。
    - fixed: `Verify` の `Added` に 4 節本文の検査を足し、英日の本文を読んで緑を確認した。
- Unproven:
  - バッジの検査は行から URL を取り出すだけで Outside の契約値と突き合わせないため、誤った URL でも緑のままになる（cycles/261030-046-dev/plan/starter-readme.md:56、README.md:3）。
    - fixed: バッジの `Added` 検査を URL 比較つきに強め、2 枚の URL が `Steps` の 2 値と一致し版が `package.json:29` と一致すること、外した写しで赤になることを確認した。
- Noise: なし — Types はなしで試験の段がなく、Added は文書の読み合わせだけで、バッジの版と画像 URL は design の Boundary が決めた値である（package.json:29）。
- Doubts:
  - `## Cycle`／`## サイクル` の 6 行は SKILL.md:3 の description の後半だけを写し、前半の Use when … を落としているが、検査の「合う」がそれを許すのかは読み切れない（README.md:63、.pi/skills/adr/SKILL.md:3）。

## Acceptance

- Ran: `pnpm test:run`（788 件）、`pnpm typecheck`（root と .pi が ok）、`pnpm lint`（警告込みで緑）、`pnpm format:check`（全ファイルが整形済み）、陳腐な文言の `grep -in` が 0 件、`Added` の 4 つの読み合わせ（見出しの並び、バッジの 2 つの URL と `package.json:29` の版、言語のリンクの行、4 節と `## Contributing`、`## License` と `## Cycle` の 6 行）。
- Findings: なし
- Doubts: なし（`## Review` の `Doubts` が同じ点を持つ）
