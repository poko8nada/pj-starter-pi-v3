# PLAN `upgrade-skill`

- No: 01, 02, 03

## Files

```text
.pi/
  skills/
    upgrade/
      SKILL.md           add
      references/
        report.md        add
        tasks.md         add
README.md                update
README.ja.md             update
DEFINITION.md            update
```

## Slices

## 1.レポートの形と、並列リサーチの文

### Types

なし

### Steps

1. `.pi/skills/upgrade/references/report.md`: レポートの形を書く。節は「前提」「一覧」「パッケージごと」「確かめ方」「決めてほしいこと」。パッケージごとの節は「当たる」「当たらない」「不明」を持ち、当たるものは 1 行ずつ「何が変わったか」「こちらの何を直すか」「根拠 URL」を並べる。`upgrade-run` で出したレポートを、そのままの形で通る見本にする。
2. `.pi/skills/upgrade/references/tasks.md`: パッケージ 1 つを調べる `research` サブエージェントに渡す文を書く。渡すもの（入っているバージョン、対象バージョン、先に読むリポジトリの現物）、返すもの（当たる / 当たらない / 不明、根拠 URL、直す場所）、そして「意見と手順の設計は書かない」を入れる。

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - base: owner が 2 つの references を読み、レポートの形が `upgrade-run` で出したものと合い、タスクの文が「範囲・読むファイル・当たる / 当たらない / 不明・根拠 URL」を持っていることを認める。

## 2.スキルの本体

### Types

なし

### Steps

1. `.pi/skills/upgrade/SKILL.md`: frontmatter の `name: upgrade` と、`Use when ...` で始まる `description` を書く。本文は `upgrade-run` が通した順（`pnpm update`、`pnpm outdated`、範囲外のパッケージごとの並列リサーチ、レポート、owner の選択、1 つずつの適用と検査、audit と fix と再 audit）を、停止点 2 つ（レポートの後、audit の残件）と一緒に書く。対象バージョンの選び方と `minimumReleaseAgeExclude` の保ち方は ADR 040 の `## 02`、audit の合否と fix は `## 03` を、規則として写す。`references/report.md` と `references/tasks.md` を名前で指す。`peerDependencies` は対象外、CI の自動更新はしない、の 2 行を「対象外」に置く。

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - other: `.pi/skills/upgrade/SKILL.md` の先頭に `name: upgrade` と、`Use when ` で始まる `description:` があることを、`grep` で見る。
  - other: `references/report.md` と `references/tasks.md` の名前が `SKILL.md` にあることを、`grep` で見る。
  - other: ADR 040 の `## 02` と `## 03` の規則が写っていることを、`minimumReleaseAge`、`pnpm update --latest`、`--audit-level`、`--fix=update` の `grep` で見る。
  - other: `peerDependencies` と CI の自動更新の 2 行が「対象外」にあることを、`grep` で見る。
  - base: owner が `SKILL.md` を読み、`upgrade-run` で通した順と、2 つの停止点と、2 つの参照が書かれていることを認める。

## 3.定義と一覧

### Types

なし

### Steps

1. `DEFINITION.md`: `Users can do` の `yolo-skill` の次に、`upgrade-skill` の 1 行を足す。
2. `README.md`: `Cycle mechanism` の行を、8 つから 9 つにし、`upgrade` を並びに足す。
3. `README.ja.md`: 同じ行を、日本語で同じように直す。

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - other: `grep -c 'nine skills' README.md` が 1、`grep -c '9 つ' README.ja.md` が 1、`grep -c 'upgrade' README.md README.ja.md DEFINITION.md` が 3 つとも 1 以上、`grep -c 'eight skills' README.md` と `grep -c '8 つ' README.ja.md` が 0。
  - base: owner が 3 つの差分を読み、`upgrade` が一覧に入り、数が 9 になり、`DEFINITION.md` の行が `yolo-skill` の次にあり、書式がほかの行と同じであることを認める。

## Notes

### Slice 1: レポートの形と、並列リサーチの文

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: スキルの本体

- Findings:
- Unplanned:
  - `SKILL.md` の `description` に「サイクルに乗せず、単独で走る」の 1 節を入れ、本文に `## Not a cycle` を足した。「`upgrade` をサイクルに乗せるか」の問いが ADR 040 に無く、slice 2 の文面からは決まらないため、ここで吸収した（owner の指示で `Unplanned` に残す）。
- Commit:
- Stopped:

### Slice 3: 定義と一覧

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
