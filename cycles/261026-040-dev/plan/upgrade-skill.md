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
  - other: `grep -c 'when it hits, what to change here' .pi/skills/upgrade/references/tasks.md` が 1。`grep -c 'Do not decide, and do not design the procedure' .pi/skills/upgrade/references/tasks.md` が 1。
  - base: owner が 2 つの references を読み、レポートの形が `upgrade-run` で出したものと合い、タスクの文が「範囲・読むファイル・当たる / 当たらない / 不明・根拠 URL・当たる時にこちらの何を直すか・意見と設計は書かない」を持っていることを認める。

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
  - other: 規則の文が写っていることを、規則ごとの句の `grep` で見る: `newest stable version that is at least`、`never with an explicit version`、`The level is not raised and not lowered`、`then the checks again`。
  - other: 対象外の 2 行が `## Out of scope` の中にあることを、`awk '/^## Out of scope$/{f=1;next} /^## /{f=0} f' .pi/skills/upgrade/SKILL.md | grep -c 'peerDependencies'` が 1、同じく `renovate` が 1、で見る。
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
- Commit: c7687c4
- Stopped:

### Cleanup: なし

- Findings:
  - なし — `## Files` にテストのファイルが無い（スキルの md と、README ・ `DEFINITION.md` だけ）ので、読むテストが無い。
- Unplanned:
  - なし

## Review

### Round 1

- Stale:
  - なし — `README.md:12-13`と`README.ja.md:12-13`の8つのまま+別行、`DEFINITION.md:43`のyolo次、`adr.md:23,61`の8→9は変更前記録でNotesのowner判断に吸収され、harnessの写しは設計どおり変更不要のため古くした文書はないことを確かめた。
- Unlisted:
  - なし — 差分の6件は`cycles/261026-040-dev/plan/upgrade-skill.md:7-18`のFilesと一致し、残る1件はplan書のNotesとReviewの記録更新のため計画外の変更はないことを確かめた。
- Gaps:
  - Stepsが返すものに求める「直す場所」をAddedのbaseが見ておらず、落としても緑のままである(`.pi/skills/upgrade/references/tasks.md:17`、`cycles/261026-040-dev/plan/upgrade-skill.md:31,38)。
    - fixed: slice 1 の `Added` に `grep -c 'when it hits, what to change here'` を足し、`base` の条件にも「当たる時にこちらの何を直すか」を入れた。
  - Stepsが求める「意見と手順の設計は書かない」をAddedのbaseが見ておらず、落としても緑のままである(`.pi/skills/upgrade/references/tasks.md:22`、`cycles/261026-040-dev/plan/upgrade-skill.md:31,38)。
    - fixed: slice 1 の `Added` に `grep -c 'Do not decide, and do not design the procedure'` を足し、`base` の条件にも「意見と設計は書かない」を入れた。
- Unproven:
  - ADRの規則の`grep`は語の有無だけを見るため、対象年齢の条件を外しても別行の同じ語で緑のままである(`.pi/skills/upgrade/SKILL.md:35,78`、`cycles/261026-040-dev/plan/upgrade-skill.md:57)。
    - fixed: 語の `grep` を、規則ごとの句の `grep` に変えた（`newest stable version that is at least`、`never with an explicit version`、`The level is not raised and not lowered`、`then the checks again`）。
  - 対象外の`grep`は置き場所を見ないため、対象外の2行を落としても手順に残る同じ語で緑のままである(`.pi/skills/upgrade/SKILL.md:34,76`、`cycles/261026-040-dev/plan/upgrade-skill.md:58)。
    - fixed: `## Out of scope` の中だけを `awk` で抜いてから `grep` する形に変えた。
- Noise:
  - なし — `grep`の語はplanとADRが決めた値や契約でTest casesのmagic numberやhardcodedには当たらず、型やスキーマが済ませる断言や誰も気づかない検査もないことを確かめた(`cycles/261026-040-dev/plan/upgrade-skill.md:55-58,78`)。
- Doubts:
  - `cycles/261026-040-dev/plan/upgrade-skill.md:30`の日本語5節と`.pi/skills/upgrade/references/report.md:10,18,22,32`の英語4見出しの対応は読み替えが要るが、ownerのbaseがupgrade-runと合うことを認めるため所見にせず残す。
  - `cycles/261026-040-dev/adr.md:23,61`の8→9と実際の8つのまま+別行のずれはNotesのowner判断で吸収されADRは変更前記録のため所見にせず残す。
  - `.pi/skills/upgrade/SKILL.md:80-86`のHow not to do thisはStepsに名指しがなくAddedも見ないが、Procedureの言い換えでownerが読むため所見にせず残す。

### Round 2

- Stale:
  - なし — Round 1 の Stale に `fixed:` はないので、見るものはない。
- Unlisted:
  - なし — Round 1 の Unlisted に `fixed:` はないので、見るものはない。
- Gaps:
  - なし — 2 件とも直っている。slice 1 の `Added`（`cycles/261026-040-dev/plan/upgrade-skill.md:38`）に `grep -c 'when it hits, what to change here'` と `grep -c 'Do not decide, and do not design the procedure'` がある。`.pi/skills/upgrade/references/tasks.md:17` と `:22` にその文がある。`base` の条件（`:39`）に「当たる時にこちらの何を直すか」「意見と設計は書かない」がある。
- Unproven:
  - なし — 2 件とも直っている。規則の句の `grep`（`cycles/261026-040-dev/plan/upgrade-skill.md:58`）は `.pi/skills/upgrade/SKILL.md:35,37,67,69` の 4 行に 1 対 1 で当たる。対象外の `awk`＋`grep`（`:59`）は `## Out of scope`（`SKILL.md:74`）で切り出し、`peerDependencies`（`:76`）と `renovate`（`:77`）を数える。置き場所を外すと落ちる形である。
- Noise:
  - なし — Round 1 の Noise に `fixed:` はないので、見るものはない。
- Doubts:
  - 今回は紙の上だけの確認である。`grep` を自分で走らせていない。文の存在は読みで確かめた。

## Acceptance

- Ran:
  - `pnpm test:run` → 55 ファイル / 718 ケース緑
  - `pnpm typecheck` → root: ok、`.pi`: ok
  - `pnpm lint` → 緑
  - `pnpm format:check` → 282 ファイル緑
  - slice 1 の `grep`: `when it hits, what to change here` 1、`Do not decide, and do not design the procedure` 1
  - slice 2 の `grep`: `name: upgrade` 1、`## Not a cycle` 1、`newest stable version that is at least` 1、`never with an explicit version` 1、`The level is not raised and not lowered` 1、`then the checks again` 1、`## Out of scope` の中の `peerDependencies` 1、`renovate` 1
  - slice 3 の `grep`: `eight skills` 1、`8 つ` 1、`upgrade` が `README.md` / `README.ja.md` / `DEFINITION.md` に各 1
  - この plan は振る舞いを足さない（スキルの文面と一覧）ので、上の検査と、slice ごとの差分の読みが check。
- Findings: なし
- Doubts:
  - `report.md` の英語の 4 見出しと、plan の日本語 5 節の対応は読み替えが要る。
  - ADR 040 の `## 01` の Scope は「スキル一覧（8→9）」のままで、実際は 8 つのまま + 別行。ADR は決定時の記録なので直していない。
  - `SKILL.md` の `## How not to do this` は slice 2 の `Steps` に名指しが無い。
