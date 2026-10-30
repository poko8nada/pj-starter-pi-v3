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
  - other — 2 枚のバッジの行から画像の URL を 2 つずつ取り出し、バッジの行を丸ごと外した写しで、この検査が赤になることを確かめる
  - other — `## Cycle` と `## サイクル` の 6 行が `adr`、`design`、`plan`、`work`、`close`、`yolo` の順で並び、各行がその `SKILL.md:3` の `description` の内容と合うことを確かめる
  - other — 2 枚の `## Contributing` と `## License` の本文を、`design.md` の `starter-readme` の `Goal` の 7 行目と 8 行目と突き合わせる

## Notes

### Slice 1: 2 枚の README

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

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
