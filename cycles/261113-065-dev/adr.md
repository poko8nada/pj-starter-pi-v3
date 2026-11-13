# ADR 065

## 01: Scope の種別を、説明ではなく問いで判定できるか

Type: _Full_

### Context

- C1: このサイクルは `ROADMAP.md` 031 の ideas の6点を扱い、エントリは 01〜06 の順に議論する。01 は adr の Scope の判定を、種別の説明から問いの表に変える点を扱う。
- C2: いまの `Scope` は、`.pi/skills/adr/references/adr.format.md` の `## Scope` が `kind | what it is` の13種の表で kind を説明し、`In:` と `Out:` の書き方だけを定める。`.pi/skills/adr/SKILL.md` の `### 1. Scope` は、全 kind を `In` か `Out` で書く、とだけ定める。
- C3: kind の説明は抽象的で、エージェントごとに in か out かの解釈がぶれ、13種の切り方が MECE でない（`ROADMAP.md` 031 の ideas）。
- C4: 新しい表は `kind | question (yes → in)` の14種（result、logic、structure、expression、upstream、downstream、existing、cost、safety、failure、verification、observability、release、other）から成り、文言は `ROADMAP.md` 031 の ideas のとおりにする。
- C5: 判定は kind ごとに独立して行い、同時に複数が in になってよい。各 kind は必ず in か out のどちらか一方に属し、Full のエントリでは、14種すべてが Scope に In か Out として1行ずつ現れる（オーナーの回答）。
- C6: 指示文のように読者の振る舞いを決める文書では、expression だけの変更でも、読者の振る舞いが変わるなら result と logic も in にする。
- C7: result と logic の境は、logic を変更して成果物が変わるなら result も in とし、両方 in でよい。
- C8: 過去の `cycles/*/adr.md` は記録であり、その時点の形のまま残っている（063 の `Context` の C8、064 の `Scope` の `Out` の migration）。
- C9: Scope の種別を、説明ではなく問いで判定できるか。

### Research & Trial

- F1: いまの 13 kind の表は `.pi/skills/adr/references/adr.format.md:93-107` にあり、`In:` は kind ごとに1行、`Out:` は理由付きで書くと、同じファイルの `:109-111` が定める。kind を列挙する場所は `adr.format.md` 以外にない。出所: `.pi/skills/adr/references/adr.format.md:93-111`、13 kind 名の `git grep` の結果
- F2: 過去の `cycles/*/adr.md` の Scope は、13 kind を In と Out に分けて書いている。061 以降は 1 エントリにつき 13 kind の行を持ち、Out の理由を括弧で書く行と、理由を書かない定型の行が混在する。出所: `cycles/261110-061-dev/adr.md`、`cycles/261111-062-dev/adr.md`、`cycles/261112-063-dev/adr.md`、`cycles/261112-064-dev/adr.md`
- F3: 063 の 01 は、`behaviour` と `format` を In と Out の両方に書いている。出所: `cycles/261112-063-dev/adr.md:18-33`
- F4: 055-dev は `behavior`（米綴り）を使い、`logs` と `monitoring` を分けて 14 行にした。archive には 13 kind 以外の kind（`values`、`detection`、`ui`、`profiles`、`char-layer`、`tests`、`code`）を使った例がある。出所: `cycles/261105-055-dev/adr.md`、`cycles/archive/261027-043-feat-scrub-update/adr.md:29-39`、`cycles/archive/261029-045-dev/adr.md:31,102,177`、`cycles/archive/261030-046-dev/adr.md:126,232`

### Scope

- In:
  - result: `adr.md` の `Scope` が、14 の問いへの yes/no で決まった kind を、`In` か `Out` のどちらか一方に1行ずつ持つようになる。
  - logic: エージェントは kind の説明を読む代わりに、14 の問いに yes/no で答えて `In`/`Out` を決める。判定の規則（独立・同時 in 可・必ず一方、指示文の特則、result と logic の境）を `Scope` の手順に置く。
  - structure: `.pi/skills/adr/references/adr.format.md` の `## Scope` の表を、`kind | what it is` の13種から、`kind | question (yes → in)` の14種に組み替える。
  - expression: 14種の kind の名前と問いの文面を、`ROADMAP.md` 031 の ideas のとおりに書く。
- Out:
  - upstream: 外部のパッケージ、ライブラリ、外部契約を足さない（文書の変更だけである）。
  - downstream: plan、close、yolo は `Scope` を読むが、kind の名前を前提にしていない（`Scope` の `In`/`Out` の形も変えない）。
  - existing: 過去の `cycles/*/adr.md` を新しい14種に書き換えない（記録はその時点の形で残す）。
  - cost: 作業時間や資源の上限を設定しない（問いが増える分の読解は、説明を読む時間と置き換わるだけである）。
  - safety: 秘密情報、権限、露出、個人データを扱わない。
  - failure: 検査を足さない（`--check` は `Scope` の kind を見ない）。
  - verification: テストとレビューの手段を変えない（形式は `adr.format.md` の校正とレビューで見る）。
  - observability: ログ、メトリクス、監査記録を足さない。
  - release: 配布、リリース、適用の方法を変えない（git の変更だけである）。
  - other: ほかに扱う関心事はない。

### Decision

- Status: **accepted**
- Main: adr の `Scope` は、13種の説明ではなく、14 の問いへの yes/no で決まり、各 kind が `In` か `Out` のどちらか一方に1行で現れる（C1, C9）
  - Add:
    - `adr.format.md` の `## Scope` に、14種の kind と問いの表（`kind | question (yes → in)`）を置く（C4, F1）
    - 判定の規則: kind ごとに独立して判定し、同時に複数が in になってよい。各 kind は必ず in か out のどちらか一方に属する（C5, F3）
    - 判定の規則: 指示文のように読者の振る舞いを決める文書では、expression だけの変更でも、読者の振る舞いが変わるなら result と logic も in にする（C6）
    - 判定の規則: logic を変更して成果物が変わるなら result も in とし、両方 in でよい（C7）
  - Update:
    - `adr.format.md` の `## Scope` の表を、13種の `kind | what it is` から、14種の `kind | question (yes → in)` に置き換える（C2, C3, C4, F1, F2, F4）
    - `adr.format.md` の `## Scope` の `In:`/`Out:` の説明を、14種すべてがどちらかに1行で現れる形に合わせる（C5, F1）
  - Drop:
    - 13種の kind の表（behaviour、refactor、dependency、naming、format、prose、speed、security、compatibility、errors、deploy、migration、logs and monitoring）（F1）
- Sub: なし
- Policy:
  - Allowed:
    - 14種の問いの文面を、`ROADMAP.md` 031 の ideas のとおりに写す（C4）
    - 判定の規則を、表の下の箇条書きとして置く（C5, C6, C7）
  - Forbidden:
    - 13種の kind を新しい表に残さない - 14種への置き換えがこのエントリの決定である（C4, F4）
    - 過去の `cycles/*/adr.md` を新しい14種に書き換えない - 記録はその時点の形で残す（C8, F2）
    - `In:`/`Out:` の入れ子の箇条書きの形を変えない - plan、close、yolo が `Scope` を読む形を保つ（C2, F1）

#### Details

- `Scope` の問いの表

  ```md
  | kind          | question (yes → in)                                                                                                                               |
  | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
  | result        | Does what can be observed from outside change? (what is returned, written, or emitted; side effects; what a reader receives)                      |
  | logic         | Do the decisions, steps, or rules that produce the result change? (conditions, order, algorithms, constraints, instructions a reader must follow) |
  | structure     | Does how things are divided, ordered, nested, or placed change? (module split, schema shape, section layout, file placement)                      |
  | expression    | Does the surface notation change? (names, wording, tone, formatting, spelling)                                                                    |
  | upstream      | Is an external thing the product relies on added, updated, or removed? (package, library, external contract, data source, cited source)           |
  | downstream    | Does anything else name, reference, or assume the changed thing? (callers, queries, links, other documents, documents that describe it)           |
  | existing      | Must an existing entity be moved or fixed? (stored data, installed versions, already-distributed documents, past records)                         |
  | cost          | Do time, resources, or money change? (speed, memory, API calls, tokens, effort)                                                                   |
  | safety        | Does it touch secrets, permissions, exposure, or personal data?                                                                                   |
  | failure       | Does the way things fail change, or is there a check, validation, constraint, or failure path that must be kept?                                  |
  | verification  | Must the means of confirming correctness (tests, checks, review steps) be added or changed?                                                       |
  | observability | Do the records or signals the product leave change? (logs, metrics, audit records)                                                                |
  | release       | Does it affect how the change is published, distributed, or applied, or how it can be rolled back?                                                |
  | other         | Is there a concern that none of the above covers?                                                                                                 |
  ```

- `adr.format.md` の判定の規則
  ```md
  - Judge each kind on its own; several kinds may be `In` at the same time.
  - Every kind belongs to `In` or `Out`, and to only one of them; every Full entry writes all 14 kinds.
  - When the document directs a reader's behavior, a change only in `expression` puts `result` and `logic` in too, if it changes what the reader does.
  - When a change of `logic` changes the artifact, `result` is `In` too; both may be `In`.
  ```

### Definition

- `Unit.adr-skill`(kept): Scope の判定が問いに変わるだけで、オーナーが決め、エージェントが記録するという主機能は変わらない（`rules/definition.rules.md:35`）。
- `Who.owner`(kept): Scope を直すのはオーナーであり、判断をするという役割は変わらない。

## 02: エントリを議論する順番を、分割の提示で示せるか

Type: _Full_

### Context

- C1: このサイクルは `ROADMAP.md` 031 の ideas の6点を扱い、エントリは 01〜06 の順に議論する。02 は adr のエントリの議論順を扱う。
- C2: `.pi/skills/adr/SKILL.md` の `### 3. Entries` は、分割、各エントリの意図、`Type` を提示させ、`## One entry` はエントリ段階を「in the order the split gave」で進めると定める。順番の条件と、順番の理由の説明は定めていない。
- C3: プリリサーチは同じ問いのエントリをまとめて実行し、エントリ段階は分割の順に進む。承認された順番が、そのまま実行の順になる。
- C4: 分割の単位（1 エントリ 1 `Main`、`Sub` の条件）を変えない。このエントリは順番の条件と提示だけを扱う。
- C5: 順番の条件は「基本的に、先に決めた結果が後のエントリに影響を与えるものが先」である（`ROADMAP.md` 031 の ideas）。「基本的に」とあるので、条件に当てはまらない並びも許す。
- C6: エントリの分割を提案する時点で、順番についても理由を説明する（`ROADMAP.md` 031 の ideas）。
- C7: オーナーが分割と順番を決め、エージェントが提案と説明をする。
- C8: エントリを議論する順番を、分割の提示で示せるか。

### Research & Trial

- F1: 分割の順は `.pi/skills/adr/SKILL.md:52`（Type の提案）、`:62`（スキャフォールド）、`:120`（Context）、`:139`（エントリ段階）、`:276`（次のエントリ）で使われる。プリリサーチのグループ化は順番ではなく、問いの同一性で決まる（`:88-89`）。出所: `.pi/skills/adr/SKILL.md:52,62,88-89,120,139,276`
- F2: close の `### 9. Proposed` は、`ROADMAP.md` の更新、分割と Type の提案、プリリサーチ、`Context` と `Research & Trial` の順に進む。次セッションはエントリの `Type` から始まる。出所: `.pi/skills/close/SKILL.md:176-193`
- F3: plan はエントリの順番に依存せず、自身の cut の順に従う。出所: `.pi/skills/plan/SKILL.md:19-25,52,68,253`
- F4: yolo は adr のサイクル段階とエントリ段階を、その順に進む。plan は cut の順に実行する。出所: `.pi/skills/yolo/SKILL.md:24,30,56`
- F5: 過去の `cycles/*/adr.md` に、自サイクルのエントリを並べた理由を書いた箇所はない。エントリ間の依存（前のエントリの決定を後のエントリが読む）は、数件の Context に書かれている。出所: `cycles/261111-062-dev/adr.md:182`、`cycles/261109-058-dev/adr.md:176`、`cycles/261112-064-dev/adr.md:612`、`cycles/261104-054-feat-ja-check-update/adr.md:85,87`

### Scope

- In:
  - result: adr の分割の提示が、各エントリの意図と `Type` に加えて、順番とその理由をオーナーに示すようになる。
  - logic: 分割の手順に、順番の条件（先に決めた結果が後のエントリに影響を与えるものが先）と、順番の理由の説明を足す。
  - expression: 順番の条件と、順番の理由を説明する文面を、`.pi/skills/adr/SKILL.md` の `### 3. Entries` に書く。
- Out:
  - structure: スキル文書のセクションの並び、表の形、ファイルの配置を変えない（提示に順番と理由を足すだけである）。
  - upstream: 外部のパッケージ、ライブラリ、外部契約を足さない（文書の変更だけである）。
  - downstream: close の `### 9. Proposed` と yolo は分割の順を使うが、順番の条件を写していない（変更しない）。
  - existing: 過去の `cycles/*/adr.md` のエントリの並びを書き換えない（記録はその時点の形で残す）。
  - cost: 作業時間や資源の上限を設定しない（説明が1行増えるだけである）。
  - safety: 秘密情報、権限、露出、個人データを扱わない。
  - failure: 検査を足さない（順番の理由は読んで確かめる）。
  - verification: テストとレビューの手段を変えない（形式はスキル文書のレビューと校正で見る）。
  - observability: ログ、メトリクス、監査記録を足さない。
  - release: 配布、リリース、適用の方法を変えない（git の変更だけである）。
  - other: ほかに扱う関心事はない。

### Decision

- Status: **accepted**
- Main: adr の分割の提示が、各エントリの意図と `Type` に加えて、順番とその理由を示し、先に決めた結果が後のエントリに影響を与えるものが先に並ぶ（C1, C3, C8）
  - Add:
    - `### 3. Entries` に、順番の条件の Note を足す。条件は、基本的に先に決めた結果が後のエントリに影響を与えるものが先で、当てはまらない並びも許す（C5, C6）
  - Update:
    - `### 3. Entries` の Step 3 を、分割、各エントリの意図、`Type` に加えて、エントリの順番とその理由を提示する形にする（C2, C6, C7, F1, F5）
  - Drop:
    - なし
- Sub: なし
- Policy:
  - Allowed:
    - 順番の理由を、分割、意図、`Type` と同じ提示に含める（C6）
    - 条件に当てはまらない並びを許す（C5）
  - Forbidden:
    - オーナーの承認なしに順番を決めない - 分割と順番を決めるのはオーナーである（C7）
    - 分割の単位（1 エントリ 1 `Main`、`Sub` の条件）を変えない - このエントリは順番だけを扱う（C4）
    - `close` と `yolo` に順番の条件を写さない - どちらも adr の分割の順を使う（F2, F4）
    - `plan` に順番の条件を写さない - plan はエントリの順番に依存せず、cut の順を使う（F3）

#### Details

- `.pi/skills/adr/SKILL.md` の `### 3. Entries` の Step 3

  ```md
  3. Show the owner the split, each entry's intent, each entry's `Type`, and the order of the entries with its reason.
  ```

- `.pi/skills/adr/SKILL.md` の `### 3. Entries` の Note に置く順番の条件
  ```md
  - Basically, an entry whose decision influences a later entry comes first.
  - An order the condition does not cover is allowed.
  ```

### Definition

- `Unit.adr-skill`(kept): 分割の提示に順番と理由が増えるだけで、オーナーが決め、エージェントが記録するという主機能は変わらない（`rules/definition.rules.md:35`）。
- `Who.owner`(kept): 分割と順番を決めるのはオーナーであり、判断をするという役割は変わらない。

## 03: Decision の Details に、どこまで書くか

Type: _Simple_

### Context

- C1: このサイクルは `ROADMAP.md` 031 の ideas の6点を扱い、エントリは 01〜06 の順に議論する。03 は adr の `#### Details` の粒度を扱う。
- C2: `.pi/skills/adr/references/adr.format.md` の `## Decision` は、`#### Details` を「the concrete code and documents the discussion settled」とし、1 フェンス 1 項目、`なし` か `_omission_` と定める。大きさの上限は書いていない。
- C3: `.pi/skills/adr/SKILL.md` の `### 2. The opening proposal` は、Full は `#### Details` を `なし`、Simple は `_omission_` で開くと定める。
- C4: plan は受理したエントリを全文読み、`#### Details` も読む。plan が具体化できるだけの情報を `#### Details` に残す。
- C5: フェンスの形（1 タイトル 1 フェンス）を変えない。
- C6: `#### Details` に、決めた具体物（文書、固有の名称、ロジック、方法、スキーマ、構成）を適宜書きたい。全文や全ロジックも、決めごととして必要なら書いてよい（一律に禁じるものではない）。決めていない部分は plan に任せる（オーナーの回答）。`ROADMAP.md` 031 の ideas は最初の案であり、ROADMAP は直さない（オーナーの回答）。
- C7: `Decision` の `#### Details` に、どこまで書くか。

### Research & Trial

- F1: `#### Details` を持つ `cycles/*/adr.md` は 062、063、064 の3サイクルで、エントリごとの行数は 28、36、77、31、44、44、120、325、58 行、フェンス数は 2、5、6、3、5、5、10、10、5 である。出所: `cycles/261111-062-dev/adr.md:94-121,217-252`、`cycles/261112-063-dev/adr.md:75-151,237-267,345-382,468-511`、`cycles/261112-064-dev/adr.md:78-197,272-596,666-723`
- F2: 064 の 02 の `#### Details` は 325 行で、`js` のフェンスを8つ持ち、関数の本文をそのまま含む。出所: `cycles/261112-064-dev/adr.md:272-596`
- F3: plan は受理したエントリを全文読む、と定める。出所: `.pi/skills/plan/SKILL.md:19`
- F4: plan のレビューの依頼は、plan md と ADR の `Main`、`Sub`、`Policy`、`Scope`、`Definition` を送ると定め、`#### Details` を送る対象に含めない。出所: `.pi/skills/plan/SKILL.md:184`
- F5: plan の参照資料で `Details` の語が出るのは1か所だけで、Simple の `Scope` と `#### Details` が `_omission_` であることを「記録がないこと」として読む、と定める。出所: `.pi/skills/plan/references/tasks.md:45-46`

### Scope

_omission_

### Decision

- Status: **accepted**
- Main: `#### Details` は、決めた具体物（文書、固有の名称、ロジック、方法、スキーマ、構成）を適宜持ち、決めていない部分は plan に任せる（C1, C6, C7）
  - Add:
    - `adr.format.md` の `## Decision` の `#### Details` に、決めた具体物（文書、固有の名称、ロジック、方法、スキーマ、構成）を適宜書き、決めていない部分は plan が具体化する、と定める規則を1本足す（C2, C4, C6, F1, F2）
  - Update:
    - なし
  - Drop:
    - なし
- Sub: なし
- Policy:
  - Allowed:
    - 決めた具体物を、必要なら全文や全ロジックも含めて書く（C6, F2）
    - 決めていない部分を plan に任せる。plan はエントリを全文読み、レビューは `#### Details` を読まない（C4, F3, F4）
    - Full は `#### Details` を `なし`、Simple は `_omission_` で開く（C3, F5）
  - Forbidden:
    - 決めた具体物を省いて一般論だけを書かない - plan が具体化できない（C4, C6, F1）
    - フェンスの形（1 タイトル 1 フェンス、1 フェンス 1 項目）を変えない - 既存の `#### Details` の読み方を保つ（C5）

#### Details

_omission_

### Definition

- `Unit.adr-skill`(kept): `#### Details` に何を書くかが具体化するだけで、オーナーが決め、エージェントが記録するという主機能は変わらない（`rules/definition.rules.md:35`）。
- `Who.agent`(kept): `#### Details` を書くのはエージェントであり、規則が具体化しても、サイクルを回すという役割は変わらない。

## 04: plan が残した未決定の点に、エージェントの意見を出せるか

Type: _Simple_

### Context

- C1: このサイクルは `ROADMAP.md` 031 の ideas の6点を扱い、エントリは 01〜06 の順に議論する。04 は plan の `### 5.` を扱う。
- C2: `.pi/skills/plan/SKILL.md` の `### 5. Confirm what the plan leaves open` は、ADR が決めていないこと、affected にないファイルを列挙し、レビューと校正の前にオーナーへ報告し、回答を待つ、と定める。エージェントの意見は求めていない。
- C3: `### 5.` の Notes は、オーナーの回答が plan の内容を決める、affected にないファイルは報告なしに触らない、全体をレビューの前に1回確認する、と定める。
- C4: 報告に、エージェントが自分のプリンシプルを基準にした意見と理由を足す。プリンシプルは YAGNI、KISS、DRY、SOLID である（オーナーの回答）。
- C5: オーナーの回答が最終決定であり、エージェントの意見は回答を置き換えない。
- C6: `### 5.` の位置（レビューと校正の前、1 回だけ全体を確認する）は変えない。
- C7: plan が残した未決定の点に、エージェントの意見を出せるか。

### Research & Trial

- F1: `### 5.` は、ADR が決めていないこと、affected にないファイルを列挙し、レビューと校正の前にオーナーへ報告し、回答を待つ、と定める。plan md 内の記録欄は定めていない。出所: `.pi/skills/plan/SKILL.md:122-134`
- F2: `cycles/*/plan/*.md` に `### 5.` の結果を書く見出しはなく、`Confirm`、`leaves open`、`決めていないこと` の一致は 0 件である。出所: `cycles/261111-062-dev/plan/`、`cycles/261112-063-dev/plan/`、`cycles/261112-064-dev/plan/` の検索
- F3: `## Notes` の `### Slice` の `Stopped` は、062、063、064 の plan でいずれも空欄である。出所: `cycles/261111-062-dev/plan/01-test-exclude-and-rename.md:333,342`、`cycles/261112-063-dev/plan/01-adr-context-first.md:222,229,236`、`cycles/261112-064-dev/plan/01-adr-type.md:750,758,765,773,780,787`
- F4: affected にないファイルは、`Notes` の `Unplanned` と `Work Review` の `Unlisted` に記録されている。061 の `.pi/extensions/consult/consult.fixture.ts`、064 の `Unlisted` の `なし` が例である。出所: `cycles/261110-061-dev/plan/01-running-widget.md:209`、`cycles/261112-064-dev/plan/01-adr-type.md:803`
- F5: `### 5.` の未決定の点に対するオーナーの回答を、ステップ5の回答として記録した plan md は見つからない。出所: `cycles/261110-061-dev/plan/`、`cycles/261111-062-dev/plan/`、`cycles/261112-063-dev/plan/`、`cycles/261112-064-dev/plan/` の検索

### Scope

_omission_

### Decision

- Status: **accepted**
- Main: plan の `### 5.` で、エージェントが「ADR が決めていないこと」と「affected にないファイル」をどう扱うかの意見と理由を示し、オーナーがそれに答える（C1, C7）
  - Add:
    - `### 5.` の Notes の末尾に、意見の根拠を YAGNI、KISS、DRY、SOLID とする Note を1本足す（C4）
  - Update:
    - `### 5.` の Step 2 を、報告に加えて、各項目をどう扱うかの意見と理由を述べる形にする（C2, F1）
  - Drop:
    - なし
- Sub: なし
- Policy:
  - Allowed:
    - 意見の根拠に、YAGNI、KISS、DRY、SOLID を使う（C4）
  - Forbidden:
    - `### 5.` の既存の Notes（回答が plan を決める、affected にないファイルは報告なしに触らない、レビュー前に1回確認する）を変えない - いまの制約を保つ（C3）
    - 意見でオーナーの回答を置き換えない - 回答が最終決定であり、過去の plan md にステップ5の回答の記録はない（C5, F5）
    - 未決定の点を記録する欄を plan md に足さない - 報告はレビューと校正の前のチャットで行い、未決定の点は `Notes` の `Unplanned` と `Work Review` の `Unlisted` に残る（F2, F3, F4）
    - `### 5.` の位置（レビューと校正の前、1 回だけ全体を確認する）を変えない - 全体の確認を1回にする（C6）

#### Details

_omission_

### Definition

- `Unit.plan-skill`(kept): `### 5.` に意見が付くだけで、1 plan 分の作業の形と順序を決めて書けるという主機能は変わらない（`rules/definition.rules.md:35`）。
- `Who.owner`(kept): 意見に答えるのはオーナーであり、判断をするという役割は変わらない。

## 05: roadmap が wip のとき、close のコミットに何を含めるか

Type: _Simple_

### Context

- C1: このサイクルは `ROADMAP.md` 031 の ideas の6点を扱い、エントリは 01〜06 の順に議論する。05 は close のコミットを扱う。
- C2: `.pi/skills/close/SKILL.md` の `### 8. Commit` は、`close.md` と `ROADMAP.md` を1つにまとめてコミットする、と定める。
- C3: `### 7. Roadmap` は、`cycles` に番号を足し、status を done にするか wip のままにするかをオーナーの言葉で決める。`ROADMAP.md` は step 7 で書かれる。
- C4: roadmap の status が wip のときは、`close.md` だけをコミットし、`ROADMAP.md` を同じコミットに含めない（`ROADMAP.md` 031 の ideas）。
- C5: このとき `ROADMAP.md` はコミットせず、作業ツリーに残す（オーナーの回答）。
- C6: `close.md` は必ずコミットする。`base(ex-change): ...` のコミットは別のコミットのままにする。
- C7: roadmap が wip のとき、close のコミットに何を含めるか。

### Research & Trial

- F1: `### 8. Commit` は、`close.md` と `ROADMAP.md` を1つにまとめてコミットし、メッセージを `close: NNN-<suffix>'s close and roadmap` とする、と定める。出所: `.pi/skills/close/SKILL.md:158-170`
- F2: close のコミットが `ROADMAP.md` を含む例と、`close.md` だけの例がある。064 の `dfdb9d6` は両方を含み、status を wip から done にした。063 の `65a4bbe` は `close.md` だけで、030 の status は別のコミット `26276ad`（wip）と `dfdb9d6`（done）で変わった。出所: `git log --name-only`、`dfdb9d6`、`65a4bbe`、`26276ad`
- F3: status を wip のままで close した 058 の `bda5c78` は、`ROADMAP.md` と `close.md` を同じコミットに入れ、status は wip のままで cycles に `058-d` を足しただけである。出所: `git log -1 -p bda5c78 -- ROADMAP.md`
- F4: close のコミットが `close.md` だけの例は、062 の `6a956f8`、063 の `65a4bbe`、060 の `2770892`、059 の `2df8190` である。062 と 063 の status は close の後に別のコミットで変わった。出所: `git log --name-only`、`27708f8`、`26276ad`、`dfdb9d6`
- F5: close コミットのメッセージは、`close: ...'s close` と `close: ...'s close and roadmap` と `update: <NNN>'s close` の3通りがある。044〜050 は `update: <NNN>'s close` で、`close.md` と `ROADMAP.md` を同じコミットに入れた。出所: `git log --name-only`、`136583a`、`3ddeae9`、`4d71870`、`12aeb6b`、`b5e52bf`、`c186b08`、`281b188`

### Scope

_omission_

### Decision

- Status: **accepted**
- Main: close のコミットは、roadmap の status が wip のときは `close.md` だけを含み、`ROADMAP.md` を同じコミットに含まなくなる（C1, C7）
  - Add:
    - `### 8. Commit` の Step 1 に、roadmap が wip のときは `close.md` だけをコミットし、`ROADMAP.md` を作業ツリーに残す条件を足す（C3, C4, C5, F1, F2, F3, F4）
  - Update:
    - `### 8. Commit` の Step 1 のメッセージを、`close.md` だけのときは `close: NNN-<suffix>'s close` にする（C4, F5）
    - `### 8. Commit` の Note `The roadmap is written before it` に、wip のときはコミットに含めないことを足す（C3, C5, F1）
  - Drop:
    - なし
- Sub: なし
- Policy:
  - Allowed:
    - roadmap が done のときは、`close.md` と `ROADMAP.md` を1つにまとめてコミットする（C2, F2）
  - Forbidden:
    - roadmap が wip のとき、`ROADMAP.md` を close のコミットに含めない - wip の roadmap を close の記録と一緒に確定させない（C4, C5, F3）
    - `base(ex-change): ...` のコミットを close のコミットに含めない - エクスチェンジは別のコミットである（C6）

#### Details

_omission_

### Definition

- `Unit.close-skill`(kept): コミットに含める範囲が変わるだけで、サイクルを閉じるという主機能は変わらない（`rules/definition.rules.md:35`）。
- `Who.owner`(kept): status を done とするか wip のままとするかを決めるのはオーナーであり、判断をするという役割は変わらない。

## 06: 修正したとき、Fixed に何を残すか

Type: _Simple_

### Context

- C1: このサイクルは `ROADMAP.md` 031 の ideas の6点を扱い、エントリは 01〜06 の順に議論する。06 は close の `Fixed` の形を扱う。
- C2: `.pi/skills/close/references/format.md` の `## Shape` は `Fixed` の行に `_ex-change_` と commit を置くと定め、`### Fields` は `Fixed` を「the `_ex-change_` and the commit it made」と説明する。
- C3: `.pi/skills/close/SKILL.md` の `### 6.` の step 4 は、`## Verified` の `Fixed` に commit を書く、と定める。
- C4: `Fixed` は、Unit の機能か、plans が変えたものが動かなかったときにだけ書く。
- C5: `Fixed` を、`Fixed: <変更内容を簡潔に説明> (<commit>)` の形にする（`ROADMAP.md` 031 の ideas）。
- C6: commit のハッシュは残す。
- C7: 修正したとき、`Fixed` に何を残すか。

### Research & Trial

- F1: `## Verified` に `Fixed` を持つ close.md は 062、063、064 の3本だけで、他の 25 本には `Fixed` の行がない。出所: `cycles/*/close.md` の検索
- F2: 063 の `Fixed` は、`_ex-change_` と commit `508e35b` の2つだけで、変更内容の文がない。`508e35b` は `base(ex-change): structure the cut's rules` で、`.pi/skills/plan/references/cut.md` を変えた。出所: `cycles/261112-063-dev/close.md:32`、`git log -1 --name-only 508e35b`
- F3: 062 と 064 の `Fixed` はすべて `- Fixed: なし` である。出所: `cycles/261111-062-dev/close.md:33,40,47,54,61`、`cycles/261112-064-dev/close.md:33,41,49,57`
- F4: `references/format.md` の `## Shape` は `Fixed` の行を `_ex-change_` と `<commit>` で書くと定め、`### Fields` は `Fixed` が「the `_ex-change_` and the commit it made」を持ち、`## Triage` の `done <commit>` の代わりになると定める。出所: `.pi/skills/close/references/format.md:47,149`
- F5: `SKILL.md` の `### 6.` の step 4 は、`## Verified` の `Fixed` に commit を書く、と定める。出所: `.pi/skills/close/SKILL.md:117`
- F6: `SKILL.md` の `### 6.` の Note は、`Fixed` が `_ex-change_` と commit だ、と定める。出所: `.pi/skills/close/SKILL.md:133`

### Scope

_omission_

### Decision

- Status: **accepted**
- Main: `## Verified` の `Fixed` が `<変更内容を簡潔に説明> (<commit>)` の形になり、何を直したかが記録に残る（C1, C7）
  - Add:
    - なし
  - Update:
    - `close/references/format.md` の `## Shape` の `Fixed` の行を、`- Fixed: <変更内容を簡潔に説明> (<commit>)` にする（C2, C5, F4）
    - `close/references/format.md` の `### Fields` の `Fixed` の説明を、変更内容と commit を持つ形にする（C2, C5, F4）
    - `close/SKILL.md` の `### 6.` の step 4 を、`Fixed` に変更内容と commit を書く形にする（C3, C5, F5）
    - `close/SKILL.md` の `### 6.` の Note `The Fixed is the _ex-change_ and the commit` を、変更内容と commit に合わせる（C5, F6）
  - Drop:
    - なし
- Sub: なし
- Policy:
  - Allowed:
    - `Fixed` は、Unit の機能か、plans が変えたものが動かなかったときにだけ書く（C4, F3）
    - commit のハッシュを残す（C6）
  - Forbidden:
    - `Fixed` を `_ex-change_` と commit だけにしない - 何を直したかが分からない（C5, F2）
    - 過去の `close.md` の `Fixed` を書き換えない - 記録はその時点の形で残す（F1）
    - `## Triage` の `done <commit>` の役割を変えない - `Fixed` はその代わりとして書く（F4）

#### Details

_omission_

### Definition

- `Unit.close-skill`(kept): `Fixed` の書き方が具体化するだけで、サイクルを閉じるという主機能は変わらない（`rules/definition.rules.md:35`）。
- `Who.owner`(kept): 修正のきっかけはオーナーの確認であり、判断をするという役割は変わらない。
