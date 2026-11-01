# DESIGN 048

## Affected

### 01: `Users can do` を、どんな形で束ねるか

- 結果を読むもの:
  - `.pi/skills/adr/SKILL.md` — `DEFINITION.md`、`rules/definition.rules.md`、`rules/definition.format.md` を読むと書く
  - `.pi/skills/design/SKILL.md` — `DEFINITION.md` をプロダクトの絵として読むと書く
  - `scripts/product-ready/targets.mjs` — `DEFINITION.md` の雛形を `rules/definition.format.md` の `## Skeleton` から返す
  - `scripts/product-ready/index.mjs` — `rules/definition.format.md` のブロックを読み、`DEFINITION.md` の `## Product` と `### What` だけを置き換える
  - `.pi/skills/adr/scripts/scaffold.mjs` — `references/format.md` の形に合わせると注記し、`Unit.<name>` の行を含む骨を出す
  - `.pi/skills/close/scripts/collect.mjs` — `close/references/format.md` が示す `## Collected` を書き、`## Triage` から `ex-` の `No` を読む
  - `.pi/skills/yolo/SKILL.md` — `close.md` の完成形と、`## Verified` が空であることをなぞる close の節を持つ
- 検査するもの:
  - `scripts/product-ready/targets.test.ts` — `DEFINITION.md` の雛形が `rules/definition.format.md` の sections 見出しであることを確かめる
  - `scripts/product-ready/index.test.ts` — `DEFINITION.md` の `Users can do` と `Stack` が残ることと、`## Product` が欠けたときに失敗することを確かめる
  - `.pi/skills/adr/scripts/scaffold.test.ts` — 骨の見出しが `references/format.md` の項目と一致することを確かめる
  - `.pi/skills/close/scripts/collect.test.ts` — `## Collected` と `Triage` 行の `No` の扱いを確かめる
- 生成されるもの: なし

### 02: design のリサーチを、1 エントリ 1 サブエージェントにまとめるか

- 結果を読むもの:
  - `scripts/harness/harness.json` — `copy` に `.pi` を含む
- 検査するもの:
  - `lefthook.yaml` — staged の `*.md` に `pnpm format` を走らせる
  - `package.json` — `format` と `format:check` の入口を持つ
  - `.oxfmtrc.json` — 整形の設定を持つ
- 生成されるもの: なし

### 03: `Always` を「5 つ」と呼ばずに、どう書くか

- 結果を読むもの:
  - `.pi/skills/plan/references/tasks.md` — review の文面が plan md の `### Verify` と `### Steps` を読むと書き、形が `.pi/skills/plan/references/format.md` にあると書く
  - `.pi/skills/work/SKILL.md` — plan md の `Files` と各スライスの `Types`・`Steps`・`Verify`・`## Notes` を読むと書き、`Always` を走らせると書く
  - `.pi/skills/work/references/tasks.md` — code の文面が `Steps` の次に `Verify` を走らせ、review の文面が `## Files`・`### Verify`・`### Steps`・`## Notes` を読み、`## Test cases` を `format.md` で読むと書く
  - `.pi/skills/yolo/SKILL.md:32` — plan 段階で、`verify` を含む plan md を書く
  - `.pi/skills/plan/SKILL.md:94` — 校正が plan md と `.pi/skills/plan/references/format.md` を読む（subject の中で、変わる `## Shape` を読む側）
- 検査するもの:
  - `.pi/skills/plan/references/tasks.md` — review の `Checks` の観点が、書いた通りに走らない `Verify` を読むと書く
  - `.pi/skills/work/SKILL.md` — acceptance が `Always` と実行できる `Added` を走らせ、全体の typecheck と test と、壊して赤を確認する手順を持つ
  - `.pi/skills/work/references/tasks.md` — review が 5 つの観点で diff が plan を閉じられるか答え、fixes が修正のあとに plan の checks を走らせると書く
  - `package.json` — `Always` の 4 本に当たる `test:related`・`typecheck`・`lint`・`format:check` を定義する
- 生成されるもの: なし

## External

### 01: `Users can do` を、どんな形で束ねるか

- なし

### 02: design のリサーチを、1 エントリ 1 サブエージェントにまとめるか

- なし

### 03: `Always` を「5 つ」と呼ばずに、どう書くか

- なし

## `users-can-do-groups`

### ADR & Where

- No: 01
- Why: エントリ 01 は `DEFINITION.md` と `rules/` の 6 ファイルを書き換え、`.pi/skills/design/SKILL.md` を読む側として名指すが書き換えないため、エントリ 02 がその 1 ファイルを書き換えても、2 つの変更は互いの結果に依らず、順序も待ちも要らない。
- Where: worktree

### Goal

- `DEFINITION.md` の `### Users can do` の下に、`####` の見出しが 5 つある。
- 5 つの `####` の行が、`- ` で始まらず、`<name>: ` の形を持たない。
- 各 `####` の見出しの下の Unit の行が、決めた割り当て（サイクルを回す 6、作った物を検査する 6、読んで知る 5、文脈を整える 3、ハーネスを保つ 3）と一致する。
- 23 の Unit の行が、変更前の `DEFINITION.md:22-44` の文言のまま、5 つのグループの順に並び、グループの中は変更前の並びのままである。
- `rules/definition.format.md:67` と `:75` の「1 行 1 Unit」の 2 行が、変更前と同一である。
- `rules/definition.rules.md` に、階層は最大 2、親は `Who` が何をするかの単位、親は Unit にしない、の 3 つを述べる文がある。
- `rules/definition.rules.md` に、親の軸に種類の語を使わないと述べる文があり、`DEFINITION.md` の 5 つの見出しのどれにも extension、skill、gate、document、script が無い。
- `rules/definition.format.md` の `## Skeleton` の `### Users can do` の下の行が、変更前と同じ 2 行である。
- `rules/definition.format.md` の `## Sections` の `Users can do` の項に、見出しで束ねてよいことと、見出しは Unit でないことが書かれている。
- `.pi/skills/adr/references/format.md:73`、`.pi/skills/close/references/format.md:72`、`.pi/skills/close/SKILL.md:90` の 3 か所が、`Users can do` の Unit を行として読み、`####` の見出しを Unit と読まないと書いている。
- `scripts/product-ready/targets.mjs` と `index.mjs` が変更前と同一で、`targets.test.ts` と `index.test.ts` が緑である。
- `Users can do` の下に、`####` の見出しでも `<name>: <Who> が、…` の行でもない行が無い。
- 23 の Unit の行の diff に、語の入れ替え（`オーナー` を `owner` にする等）が 1 つも無い。
- 23 の Unit の名（`adr-skill` など）が、変更前と同一である。
- `Users can do` の下の階層が、`####` の見出しと、1 行 1 Unit の行の 2 段である。
- `rules/definition.rules.md` の階層の節と、`rules/definition.format.md` の `## Sections` に、決めた形を述べる文がある。
- `Users can do` を読む 3 か所の記述が、変更後の `DEFINITION.md` の形（見出しと行）と一致する。

### Non-goal

- `Users can do` の置き場所（`### Users can do`）と、`rules/` のファイルの分け方を変えない（理由: ADR `Scope` の `refactor: out`）。
- clone 済みのプロダクトの `DEFINITION.md` を新しい形へ移す手段を作らない（理由: ADR `Scope` の `migration: out`）。
- パッケージを足さない（理由: ADR `Scope` の `dependency: out`）。
- 実行時の挙動を作らない（理由: ADR `Scope` の `behaviour: out`。`DEFINITION.md` は文書である）。
- `speed`、`security`、`errors`、`deploy`、`logs and monitoring` は、この plan が実行時を持たないため当たらない（理由: ADR `Scope` の同じ `out`）。
- `Users can do` の外に新しいセクション（`### Parts` など）を足さない（理由: 採らなかった案。`Who` が届かないものは残しようがない、という owner の判断）。
- `Users can do` の中に行の種類を 2 つ持たない（理由: 採らなかった案。加えて「1 行 1 Unit」の改訂が要る）。
- 親を入れ子の行にしない（理由: 採らなかった Option D。`adr/references/format.md:73` と `close/references/format.md:72` の読み方も直すことになる）。
- 種類（extension、skill、gate、document、script）で束ねない（理由: 採らなかった Option C。`rules/definition.rules.md:20` の kinds は例であって規則ではなく、ハーネス固有の語を絵に持ち込む）。
- `Who` で束ねない（理由: 採らなかった Option B。owner 側が 5 行、agent 側が 18 行に偏る）。

### Summary

- `Users can do` を、`Who` が何をするかで 5 つの `####` 見出しに束ねる。
- 規則に階層化の条件と考え方を足し、雛形と `## Sections` をその形に合わせる。
- 読む側（adr の `Unit.<name>`、close の verify の対象）を、Unit を「行」で読む形に揃える。

### Paths

- `DEFINITION.md`
- `rules/definition.rules.md`
- `rules/definition.format.md`
- `.pi/skills/adr/references/format.md`
- `.pi/skills/close/references/format.md`
- `.pi/skills/close/SKILL.md`

### Boundary

- Plans: なし
- External: なし

## `design-research-merge`

### ADR & Where

- No: 02
- Why: エントリ 02 は `design/` の 2 ファイルを書き換え、エントリ 01 は `.pi/skills/design/SKILL.md` を読む側として名指すだけで書き換えないため、書き換えるパスは重ならず、2 つの変更は互いの結果に依らないので、順序も待ちも要らない。
- Where: worktree

### Goal

- `.pi/skills/design/SKILL.md` の step 2 を読むと、`accepted` エントリごとに 1 つの `research` サブエージェントを走らせると書いてある。
- `design/references/tasks.md` の `research` のタスクを読むと、変更が触れるパスと、リポジトリの外で話すものの 2 つの観点が、同じ 1 つのタスクの中に書いてある。
- `design/references/tasks.md` の `research` のタスクが 1 つで、`:37` の「パスの walk の隣で走る、エントリごとに 1 人」の行が、1 人のタスクに合う文に変わっている。
- `design/references/tasks.md` に、限界・打ち切り・`Stopped` を求める行が増えていない。
- `design/references/format.md` が変更前と同一である。
- `design/references/tasks.md` のレビューのタスク（6 つの観点と coverage）が変更前と同一である。
- `.pi/skills/yolo/SKILL.md` の design の節が変更前と同一である。
- `.pi/skills/design/SKILL.md` と `design/references/tasks.md` を読むと、リサーチの起動が 1 エントリあたり 1 回である。
- `.pi/skills/design/SKILL.md` を読むと、1 エントリあたりの `research` サブエージェントが 1 つであり、2 つではない。
- `design/SKILL.md` と `design/references/tasks.md` に、打ち切りの扱いを新しく定める行が無い。

### Non-goal

- design のほかの手順（cut、name、section、review、proofread、show）を変えない（理由: ADR `Scope` の `refactor: out`）。
- パッケージを足さない（理由: ADR `Scope` の `dependency: out`）。
- `design.md` の欄と `### <NN>: <entry の問い>` の形を変えない（理由: ADR `Scope` の `compatibility: out`）。
- 閉じたサイクルの `design.md` を書き換えない（理由: ADR `Scope` の `migration: out`）。
- 実行時の挙動を作らない（理由: ADR `Scope` の `behaviour: out`。この plan は指示文だけを扱う）。
- `security`、`deploy`、`logs and monitoring` は、この plan が実行時を持たないため当たらない（理由: ADR `Scope` の同じ `out`）。
- 2 つのサブエージェントのままにしない（理由: 採らなかった Option B。roadmap 010 の idea を採らないことになる）。
- 打ち切りの報告の形をタスクの文面に足さない（理由: 採らなかった Option C。`budget.ts:33` の促しと役割が重なる）。

### Summary

- design の step 2 を、1 エントリ 1 サブエージェントにする。
- `design/references/tasks.md` の 2 つのタスクを 1 つにまとめ、観点は同じまま残す。
- `design.md` の欄とレビューの観点は変えない。

### Paths

- `.pi/skills/design/SKILL.md`
- `.pi/skills/design/references/tasks.md`

### Boundary

- Plans: なし
- External: なし

## `plan-always-five`

### ADR & Where

- No: 03
- Why: エントリ 03 は `plan/` の 2 ファイルを書き換え、エントリ 01 と 02 はどちらのパスも書き換えず読む側としても名指さないため、書き換えるパスは重ならず、待つものはない。
- Where: worktree

### Goal

- `plan/references/format.md` の `## Shape` の `Always` が、5 本の行を持つ。
- 5 本のうち、関連テストの行に `pnpm test:related <changed files>` が入り、grep の行に、このスライスが変えた名前と説明を対象にすることが入っている。
- `plan/references/format.md` に `既定の 5 つ` の文字が無い。
- `plan/references/format.md` に「these five」と「the five above」の文字が無い。
- `plan/SKILL.md` に「the five」の文字が無く、`:63` の 5 本の列挙が残り、`:122` が 5 本を指す新しい文になっている。
- `work/SKILL.md:60` と `yolo/SKILL.md:34` の「five viewpoints」の行が変更前と同一である。
- `package.json` と `work/references/tasks.md` が変更前と同一である。
- `cycles/` の下の plan md が 1 つも変わっていない。
- `plan/references/format.md:50` の雛形が、5 本の検査の行を持つ。
- `plan/references/format.md:149` と `:161` の文が、5 本を指す新しい文になっている。

### Non-goal

- `package.json` に検査をまとめる script を足さない（理由: ADR `Scope` の `behaviour: out`。このエントリは書き方だけを扱う）。
- `Always` と `Added` の欄の名を変えない（理由: ADR `Scope` の `naming: out`）。
- plan の手順と、`Verify` の 2 つの欄の並びを変えない（理由: ADR `Scope` の `refactor: out`）。
- パッケージを足さない（理由: ADR `Scope` の `dependency: out`）。
- 閉じたサイクルの plan md を `既定の 5 つ` から書き換えない（理由: ADR `Scope` の `migration: out`）。
- `speed`、`security`、`errors`、`deploy`、`logs and monitoring` は、この plan が実行時を持たないため当たらない（理由: ADR `Scope` の同じ `out`）。
- 5 本の名だけを書く形にしない（理由: 採らなかった Option B。worker は名だけでは走れず、`work/references/tasks.md:10` は `format.md` を読めと言わない）。
- plan md を略記のまま、worker のタスク文面に 5 本を渡さない（理由: 採らなかった Option C。roadmap 010 の idea を採らないことになり、`Always` が 2 つの意味を持つ）。
- レビューの「five viewpoints」を変えない（理由: `Always` とは別の 5 である）。

### Summary

- plan md の `Verify` の `Always` に、5 本の検査を毎回書き下す形にする。
- `plan/references/format.md` の雛形から `既定の 5 つ` を消し、「these five」「the five above」を書き直す。
- `plan/SKILL.md` から「the five」を消す。

### Paths

- `.pi/skills/plan/SKILL.md`
- `.pi/skills/plan/references/format.md`

### Boundary

- Plans: なし
- External: なし
