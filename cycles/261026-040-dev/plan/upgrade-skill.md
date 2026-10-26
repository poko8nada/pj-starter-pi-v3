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
2. `README.md`: `Cycle mechanism` の行は 8 つのままにし、その次の行に `Packages` の 1 行を足す。`upgrade` はサイクルに乗らないので、サイクルの一覧には入れない。
3. `README.ja.md`: 同じく、`サイクルの仕組み` の行は 8 つのままにし、その次の行に `パッケージ` の 1 行を足す。

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - other: `grep -c 'eight skills' README.md` が 1、`grep -c '8 つ' README.ja.md` が 1（サイクルの一覧は 8 つのまま）。`grep -c 'upgrade' README.md README.ja.md DEFINITION.md` が 3 つとも 1 以上。
  - base: owner が 3 つの差分を読み、`README` のサイクルの一覧が 8 つのままで、`upgrade` が別の 1 行にあり、`DEFINITION.md` の行が `yolo-skill` の次にあり、書式がほかの行と同じであることを認める。

## Notes

### Slice 1: レポートの形と、並列リサーチの文

- Findings:
  - なし
- Unplanned:
  - slice 1 の `base` の条件が「ADR 040 の `## 02` と `## 03` の規則が写っている」としていたが、その規則は `SKILL.md`（slice 2）の持ち物で、references には入らない。条件を「レポートの形が `upgrade-run` と合い、タスクの文が範囲・読むファイル・当たる / 当たらない / 不明・根拠 URL を持つ」に直した。
- Commit: b70b10e
- Stopped:

### Slice 2: スキルの本体

- Findings:
  - なし
- Unplanned:
  - `SKILL.md` の `description` に「サイクルに乗せず、単独で走る」の 1 節を入れ、本文に `## Not a cycle` を足した。「`upgrade` をサイクルに乗せるか」の問いが ADR 040 に無く、slice 2 の文面からは決まらないため、ここで吸収した（owner の指示で `Unplanned` に残す）。
- Commit: f4c32a6
- Stopped:

### Slice 3: 定義と一覧

- Findings:
  - なし
- Unplanned:
  - plan の step と `Verify` が「`README` のサイクルの一覧を 8 つから 9 つに」としていたが、`upgrade` はサイクルに乗らないので一覧は 8 つのままにし、`upgrade` は別の 1 行にした（owner の判断）。
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
