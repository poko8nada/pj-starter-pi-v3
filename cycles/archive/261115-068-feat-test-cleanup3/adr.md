# ADR 068

## 01: adr スクリプトのテスト整理

Type: _Full_

### Context

- C1: `.pi/skills/adr/scripts/index.test.ts` は 799 行で、`adr.mjs`、`affected.mjs`、`cycle.mjs`、`index.mjs` の単体と CLI を確認している。CLI のテストは `index.mjs` を `spawnSync` で呼ぶ。
- C2: このエントリでは振る舞いを変えない。テストの削除、統合、文言の修正だけを行い、実装の出力、エラー、ファイルの形を変えない。バグになり得る実装は、修正せずに報告する。
- C3: ROADMAP 030 の意図は、不要なテストを整理することである。目的はテストを減らすことではなく、同じ事実を 1 か所で確認し、残すテストの意図が読める状態にすることである。プリンシプルの外にあるテストは削除する（オーナーの指示）。
- C4: 一時ツリーを組むテストが複数あり、`cycles/<name>/adr.md` と `affected/` を毎回作っている。それを共通の helper にまとめられるかが問いである。
- C5: このエントリの問いは、`index.test.ts` の重複した確認、同じ前提の作り直し、古い記述、プリンシプル外のテストを整理できるかである。
- C6: このエントリの決定は、後の `close` エントリが踏襲する。

### Research & Trial

- F1: `index.test.ts` は 799 行で、単体テストと CLI テストの 2 種類を持ち、CLI テストは `index.mjs` を `spawnSync` で実行する。出所: `index.test.ts:625-799`
- F2: 一時ツリーを組むテストは 13 か所あり、`adr.md` の種類（`adrSkeleton`、題名付き、Simple、`appendEntry` 3 件、手書き全文）、`affected/` の有無と件数（なし、01、01-03）、CLI 引数（`--add`、`--delete`、`--set`、`--check`）、事後の読み取り対象（`adr.md`、`affected`、`readdir`、`existsSync`、`status`）が異なる。出所: `index.test.ts:560-790`
- F3: Simple の `_omission_` について、同じ 2 行を確認するテストが 6 か所（`443-444`、`487-488`、`672-673`、`692-693`、`753`、`775-776`）ある。出所: `index.test.ts:440-445,483-488,660-674,677-694,738-753,756-777`
- F4: `lastEntryNumber` について、確認するテストが 3 か所（`450-451`、`538-546`、`554-555`）ある。出所: `index.test.ts:448-465,532-557`
- F5: Full の骨組み（`- In:` と ` ```text `）について、確認するテストが 2 か所（`433-437`、`475-480`）ある。出所: `index.test.ts:432-446,474-494`
- F6: `setEntryTitle` は単体テスト（`497-503`）と CLI テストの `--set`（`722-735`）で、`deleteEntry` は単体テスト（`511-518`）と CLI テストの `--delete`（`697-719`）で確認するテストがある。出所: `index.test.ts:496-523,697-735`
- F7: `index.test.ts:581` の表題「close.md を持つだけ」は、テストが前提として `adr.md` と `close.md` の両方を書いており、実装は `adr.md` の存在を先に確かめる。出所: `index.test.ts:581-588`, `cycle.mjs:389-390`
- F8: primitive・定数の写しに当たる確認がある。`adrSkeleton` の見出し（`28`、`38`）、`parseArgs` の正常値（`149-194`）、`entrySkeleton` の文字列含有（`226`、`242`、`258`、`264`）、Type の文字列含有（`433`、`440`）、`affectedEntrySkeleton` の文字列含有（`605`、`621`）。出所: `index.test.ts:27-41,148-223,225-267,432-446,604-623`
- F9: すでに存在しない振る舞いを確認するテストはない。読まれない引数、使われない定数もない。出所: consult-1 の報告 3, 6
- `cycleNumberOf`、`typeLine`、`scopeBody`、`detailsBody`、`sectionRange` は export されているが、`index.mjs` と `index.test.ts` から直接参照されない。出所: `cycle.mjs:229`, `adr.mjs:6,15,28,116`

### Scope

- In:
  - result: テストの集合と、テストが確認する結果を変える。製品の出力、エラー、ファイルの形は変えない。
  - logic: テストの判断と前提の組み立てを変える（重複の統合、helper の導入）。
  - structure: テストファイル内の helper、`describe`/`it` の分け方、一時ツリーの作り方を変える。
  - expression: テスト名、コメント、表題を現在の実装に合わせる。
  - existing: 既存の `index.test.ts` と、その中のテストを更新・統合・削除する。
  - cost: テストの実行時間と行数が減る。製品の実行時の速度、メモリ、API 呼び出し、トークンは変えない。削減量は判断の基準にしない。
  - failure: エラー分岐を確認するテストは残す。削除する場合は、残す側のテストか存在しない理由を対応付ける。
  - verification: テストの整理後も振る舞いが変わらないことを、`pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`node .pi/skills/adr/scripts/index.mjs --check` で確かめる。
- Out:
  - upstream: 外部の package、contract、data source を変えない（対象はリポジトリ内のテストだけである）。
  - downstream: テストファイルを参照する他のファイルを変えない（`vitest.config.ts` の対象に変化はない）。
  - safety: secret、permission、個人データに触れない（テストの整理だけである）。
  - observability: 製品の log、metric、監査記録を変えない（テストの整理だけである）。
  - release: 公開、配布、適用、rollback の方法を変えない（git の変更だけである）。
  - other: なし（該当する関心事がない）。

### Decision

- Status: **accepted**
- Main: adr スクリプトのテストが、同じ事実を 1 か所で確認する形になり、一時ツリーの前提が 1 つの helper に集まり、プリンシプルの外にある primitive・定数の確認が消える（C1, C3, C4, C5）
  - Add:
    - `index.test.ts` の隣の `cycle.fixture.ts` に、一時ツリーを組む helper を 1 つ置く（C4, C6, F2）
    - helper は `adr.md` の種類、`affected/` の有無と件数、`close.md` の有無をオプションで受け取る（C4, F2）
  - Update:
    - Simple の `_omission_` の確認を、単体テスト 1 か所と CLI テスト 1 か所に絞る（C3, F3）
    - `lastEntryNumber` の確認を単体テスト 1 か所に絞り、`appendEntry` のテストから同じ断言を外す（C3, F4）
    - Full の骨組みの確認を `entrySkeleton` の Full に絞り、`setEntryType` の Full から同じ断言を外す（C3, F5）
    - `setEntryTitle` と `deleteEntry` は単体テストの判断を残し、CLI テストは `adr.md` と `affected/` の経路だけを確認する（C3, F6）
    - `index.test.ts:581` の表題を「`adr.md` と `close.md` を持つ → null」に直す（C1, F7）
    - primitive・定数の確認（`adrSkeleton` の見出し、`parseArgs` の正常値、`entrySkeleton` の文字列、Type の文字列、`affectedEntrySkeleton` の文字列）を削除するか、振る舞いの確認に統合する（C3, F8）
    - 13 か所の一時ツリーを helper の呼び出しに置き換える（C4, F2）
  - Drop:
    - Simple `_omission_` の重複した断言（残す 2 か所以外）（C3, F3）
    - `appendEntry` のテスト内の `lastEntryNumber` の断言（C3, F4）
    - `setEntryType` の Full の骨組みの断言（C3, F5）
    - CLI の `--set` と `--delete` が単体と同じ値・文字列を断言する行（C3, F6）
    - primitive・定数の確認（`adrSkeleton` の見出し、`parseArgs` の正常値、`entrySkeleton` の文字列、Type の文字列、`affectedEntrySkeleton` の文字列）（C3, F8）
    - helper を使わずに組んだ一時ツリー 13 か所（helper に置き換える）（C4, F2）
- Policy:
  - Allowed:
    - 単体と配線が同じ事実を確認する場合、判断・変換は単体に残し、配線は経路だけを確認する（C2, C3, F1）
    - 一時ツリーの前提を helper にまとめ、テストごとの違いはオプションで表す（C4, C6, F2）
    - テスト名、コメント、表題を現在の実装に合わせる（C2, F7）
    - primitive・定数の確認を削除する（C3, F8）
  - Forbidden:
    - 製品の出力、エラー、ファイルの形を変える - 振る舞いを変えないため（C2）
    - エラー分岐を確認するテストを、残す側の対応付けなしに削除する - 失敗経路の確認を失わないため（C2, F9）
    - 同じ値の断言を単体と配線の両方に置く - 同じ事実を 2 か所で確認しないため（C3, F1）
    - テストを整理するために実装の振る舞いを変える - このサイクルの目的がテストの整理だから（C2）

#### Details

- Simple の `_omission_` を残す側
  ```text
  単体: `index.test.ts:443-444` の `entrySkeleton` の Simple に残す。
  CLI: `index.test.ts:672-673` の `--add` の新規作成 Simple に残す。
  外す: `index.test.ts:487-488`、`692-693`、`753`、`775-776` の `_omission_` の断言。
  `setEntryType` の Simple は、元の `- In:` と Details のフェンスが消えることを確認する。
  ```
- `lastEntryNumber` を残す側
  ```text
  単体: `index.test.ts:449-451` の `lastEntryNumber` に残す。
  外す: `index.test.ts:546`、`555` の `appendEntry` テスト内の `lastEntryNumber` の断言。
  `appendEntry` のテストは、追記、`# ADR` が 1 つのまま、末尾の `## NN: 題名` を確認する。
  ```
- Full の骨組みを残す側
  ```text
  単体: `index.test.ts:433-438` の `entrySkeleton` の Full に残す。
  外す: `index.test.ts:479-480` の `setEntryType` の Full の `- In:` とフェンスの断言。
  `setEntryType` の Full は、題名と Type に加え、元の `_omission_` が消えることを確認する。
  ```
- `setEntryTitle` と `deleteEntry` を残す側
  ```text
  単体: `index.test.ts:497-503` の `setEntryTitle`、`511-518` の `deleteEntry` に判断を残す。
  CLI `--set`: `adr.md` と `affected/01.md` の両方が更新される経路を確認する。
  CLI `--delete`: `affected/` の振り直しと `03.md` の消滅を確認する。`adr.md` は削除した題名が消えていることだけを見る。
  ```
- 一時ツリーの helper の形
  ```ts
  export type CycleSpec = {
    readonly name?: string;
    readonly adr?: string | null;
    readonly close?: string | null;
    readonly affected?: readonly { readonly nn: number; readonly title?: string }[];
  };

  export function cycleTree(cycles?: readonly CycleSpec[]): {
    readonly root: string;
    readonly cyclesDir: string;
    readonly dirs: readonly string[];
  };
  ```
- primitive・定数の確認の削除・統合
  ```text
  統合: `index.test.ts:28` と `38` を 1 本にし、見出しの 1 例と題名の補間を確認する。
  統合: `index.test.ts:605` と `621` を 1 本にし、見出しと題名を確認する。`Kind`/`Edge` の選択肢全文は落とす。
  残す: `entrySkeleton` の `242`（見出しの構造、`出所:` を 1 行足す）、`264`（題名）、`433`/`440`（Type）。
  残す: `parseArgs` の `174`（`--add` Simple）、`178`（`--delete`）、`182`/`186`（`--set`）、`198`/`204`/`211`/`216`/`220`（エラー）。
  削除: `parseArgs` の `149`（空の既定）、`159`（`--root`）、`170`（`--add` Full）、`194`（`--check`）。
  削除: `entrySkeleton` の `226`（フィールドの文字列の写し）、`258`（`In`/`Out` の含有）。
  ```
- `structure` の範囲
  ```text
  13 か所のサイクルツリーは `cycleTree` に置き換える。
  サイクルツリーを作らない `createLeafDir`、`dirNames`、CLI の「操作なし」は `tempDir` のままにする。
  `describe` は関数ごとのままにし、統合は `adrSkeleton` と `affectedEntrySkeleton` の中で行う。
  `checkEntry` 用の `entry`/`decision` helper はテストファイル内に残す。
  import の整理は plan で行う。
  ```
- `expression` の範囲
  ```text
  `index.test.ts:581`: 「`adr.md` と `close.md` を持つ → null」に直す。
  `adrSkeleton` の統合後: 「番号を 0 埋めした見出しで始まり、題名が最初のエントリに入る」。
  `affectedEntrySkeleton` の統合後: 「affected.format.md の見出しとブロックを持ち、題名が入る」。
  `entrySkeleton` の `242`: 「見出しの順と `出所:` を持つ」。
  それ以外のテスト名は変えない。
  ```
- `existing` の範囲
  ```text
  `cycleTree` に置き換える 13 か所: `index.test.ts:560`、`574`、`581`、`591`、`628`、`647`、`660`、`677`、`697`、`722`、`738`、`756`、`780`。
  `tempDir` のまま: `index.test.ts:121`、`134`、`143`、`794`。
  F8 以外で残す: `toYYMMDD`（78）、`nextNNN`（90、96、100）、`cycleDirName`（108）、`entryNumbers`（468）。
  ```
- 残すエラー分岐のテスト
  ```text
  `createLeafDir` の EEXIST（120）、`parseArgs` の 198/204/211/216/220、`lastEntryNumber` の 459、`checkEntry` の 323/328/358/363/368/397/401/407/414/421/426、`setEntryType`/`setEntryTitle`/`deleteEntry` の 491/505/520、CLI の 793。
  ```
- `verification` のコマンド
  ```text
  全件: `pnpm test:run`
  型: `pnpm typecheck`
  lint: `pnpm lint`
  ADR: `node .pi/skills/adr/scripts/index.mjs --check`
  ```

### Definition

- `Unit.adr-skill`(kept): オーナーが決め、エージェントが記録できるという主機能は変わらず、変わるのはテストという検査の内容である。
- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取れるという主機能は変わらず、変わるのは走らせるテストの内容である。
- `Stack.Checks.Test runner`(kept): vitest のままで、テストの内容だけが変わる。

## 02: close スクリプトのテスト整理

Type: _Full_

### Context

- C1: `.pi/skills/close/scripts/collect.test.ts` は 158 行、`collect.fixture.ts` は 23 行で、`collect.mjs` の `planName`、`noOf`、`writeClose`、`collectPlan` を確認している。
- C2: このエントリでは振る舞いを変えない。テストの削除、統合、前提の共有だけを行い、`collect.mjs` の出力を変えない。
- C3: ROADMAP 030 の意図は、不要なテストを整理することである。目的はテストを減らすことではなく、同じ事実を 1 か所で確認し、残すテストの意図が読める状態にすることである。プリンシプルの外にあるテストは削除する（オーナーの指示）。
- C4: `setupCycle()` と同形の一時ツリーが複数あり、テストが `planDoc` を `collect.fixture.ts` から受け取っている。`setupCycle()` を全件で使えるかが問いである。
- C5: このエントリの問いは、`collect.test.ts` の前提の共有と重複の統合、プリンシプル外のテストの削除ができるかである。
- C6: このエントリでは `adr` エントリの後に作業を行い、`adr` が決めた helper の形を踏襲する。

### Research & Trial

- F1: `collect.test.ts` の 9 テストは `planName` 2、`noOf` 2、`writeClose` 3、`collectPlan` の review 2、Policy 1 で、`collect.mjs` の現在の分岐に対応している。出所: `collect.test.ts:30-157`
- F2: `setupCycle()` は 3 テスト（`51`、`60`、`67`）だけで使われ、残り 4 テスト（`85-93`、`101-112`、`119-126`）は同じ形の一時ツリーを `setupCycle()` を使わずに作っている。前提は 2 件/1 件、`close.md` あり/なし、review あり/なしで異なる。出所: `collect.test.ts:16-28,51-143`
- F3: 番号行の下の文脈について、`writeClose` 経由で確認するテストが 2 か所（`66-76`、`118-143`）ある。後者はファイル追加後の通し番号も見るため、同じ事実だけではない。出所: `collect.test.ts:66-76,118-143`, `collect.mjs:299-327`
- F4: `Work Review Round 1` の写像について、単体テスト 2 か所（`84`、`156`）と配線テスト 1 か所（`97`）で確認するテストがある。`156` は `Policy:` 接頭辞の剥がしも見る。出所: `collect.test.ts:80-98,147-156`, `collect.mjs:24,160-168,196`
- F5: `collectPlan with review` の 1 本目は、同じ `doc` の `finding` と `place` を `collectPlan` 直接（`83-84`）と `writeClose` 経由（`96-97`）の両方で確認している。出所: `collect.test.ts:80-98`
- F6: `Policy` の `place`（`156`）は `84` と同じ写像の再確認である。出所: `collect.test.ts:84,156`
- F7: すでに存在しない振る舞いを確認するテストはなく、実装の値だけを写すテストもない。出所: consult-2 の報告 3
- F8: `setupCycle()` の返す `planDir` は 3 呼び出しのどれも読まない。`PlanDocOptions` は export されているが、テストは `planDoc` だけを import する。`collectCycle` は export されているが、テストは import しない。出所: `collect.test.ts:4,27,52,60,67`, `collect.fixture.ts:9-14`, `collect.mjs:348`
- F9: `collect.mjs` に読まれない引数、使われない定数はない。出所: consult-2 の報告 6

### Scope

- In:
  - result: テストの集合と、テストが確認する結果を変える。製品の出力、エラー、ファイルの形は変えない。
  - logic: テストの判断と前提の組み立てを変える（重複の統合、`cycleTree` のオプション化）。
  - structure: `cycleTree` の形と、`collect.test.ts` 内の前提の組み立て、`describe`/`it` の分け方を変える。
  - expression: 統合したテスト名を内容に合わせ、`CloseCycleSpec` のオプション名を足す。
  - existing: 既存の `collect.test.ts` と `collect.fixture.ts` を更新・統合する。
  - cost: テストの実行時間と行数が減る。製品の実行時の速度、メモリ、API 呼び出し、トークンは変えない。削減量は判断の基準にしない。
  - failure: エラー分岐を確認するテスト（`planName` の error）は残す。
- Out:
  - upstream: 外部の package、contract、data source を変えない（対象はリポジトリ内のテストだけである）。
  - downstream: テストファイルと fixture を参照する他のファイルを変えない（`vitest.config.ts` の対象に変化はない）。
  - safety: secret、permission、個人データに触れない（テストの整理だけである）。
  - verification: 確認の手段（`pnpm test:run`、`typecheck`、`lint`）は変えない（テスト自体が成果物であり、手段ではない）。
  - observability: 製品の log、metric、監査記録を変えない（テストの整理だけである）。
  - release: 公開、配布、適用、rollback の方法を変えない（git の変更だけである）。
  - other: なし（該当する関心事がない）。

### Decision

- Status: **accepted**
- Main: close のテストが、同じ事実を 1 か所で確認する形になり、`setupCycle` が全テストの一時ツリーをオプションで覆い、配線に重ねた単体の断言が消える（C1, C3, C4, C5）
  - Add:
    - `close/scripts/cycle.fixture.ts` に、一時ツリーを組む `cycleTree` を置く（C4, C6, F2）
    - `cycleTree` は plan の配列（ファイル名と `planDoc` の文書）と `close.md` の有無をオプションで受け取る（C4, F2）
  - Update:
    - `writeClose` 3、review 2、再実行 1 のテストで `cycleTree` を使う（C3, C4, F2）
    - 番号行の下の文脈の 2 か所は、後者がファイル追加後の通し番号も見るため、統合せずに残す（C3, F3）
    - `collectPlan with review` の 1 本目は 1 本のまま、`collectPlan` 直接の単体テストの断言と `writeClose` 経由の配線テストの断言に分けて、配線側は経路だけを見る（C3, F5）
    - `Policy` の `place`（156）を外し、`Policy:` 接頭辞の剥がし（155）を残す（C3, F6）
    - `PlanDocOptions` の export を外す（F8）
    - 統合したテスト名を内容に合わせる（C2）
  - Drop:
    - helper を使わずに組んだ一時ツリー（85-93、101-112、119-126）（C3, C4, F2）
    - `review` 1 本目の配線側の `finding`/`place` の断言（96-97）（C3, F5）
    - `Policy` テストの `place` の断言（156）（C3, F6）
    - 重複した `Work Review Round 1` の断言（C3, F4）
    - `setupCycle` の `planDir` の返り値（F8）
    - `PlanDocOptions` の `export`（F8）
- Policy:
  - Allowed:
    - 単体と配線が同じ事実を確認する場合、判断・変換は単体に残し、配線は経路だけを確認する（C2, C3, F1）
    - 一時ツリーの前提を `cycleTree` にまとめ、テストごとの違いはオプションで表す（C4, C6, F2）
    - `planDoc` を fixture に残し、テストは `cycleTree` に plan の配列を渡す（C4, F2）
    - すでに存在しない振る舞いのテストはないため、削除は重複と前提の整理に限る（C3, F7）
    - `collect.mjs` に読まれない引数、使われない定数はないため、実装は触らない（C2, F9）
  - Forbidden:
    - 製品の出力、エラー、ファイルの形を変える - 振る舞いを変えないため（C2）
    - エラー分岐を確認するテストを、残す側の対応付けなしに削除する - 失敗経路の確認を失わないため（C2）
    - 同じ値の断言を単体と配線の両方に置く - 同じ事実を 2 か所で確認しないため（C3, F1）
    - テストを整理するために実装の振る舞いを変える - このサイクルの目的がテストの整理だから（C2）

#### Details

- `cycleTree` の形
  ```ts
  export type CloseCycleSpec = {
    readonly plans?: readonly { readonly file: string; readonly doc: string }[];
    readonly close?: string | null;
  };

  export function cycleTree(spec?: CloseCycleSpec): string;
  ```
- review 1 本目の単体と配線の分け方
  ```text
  単体: `collectPlan` の `finding`/`place`（`collect.test.ts:83-84`）を残す。
  配線: `writeClose` の見出し（`95`）と番号行の存在（`/^\d+\. /`）を確認し、`finding`/`place`（`96-97`）は外す。
  テスト名: 「review の指摘を `collectPlan` が拾い、`writeClose` が `## Collected` に書く」。
  `Work Review Round 1` の写像は `84` に 1 か所だけ残す。
  ```
- Policy テストの `place`
  ```text
  `collect.test.ts:156` の `place` の断言を外す。
  `collect.test.ts:155` の `finding`（`Policy:` 接頭辞の剥がし）を残す。
  `Work Review Round 1` の写像は `84` に 1 か所だけ残す。
  ```
- `PlanDocOptions` と plan の定数の置き場所
  ```text
  `collect.fixture.ts`: `planId`、`adrNo`、`planFile`、`betaFile`、`normalPlan`、`betaPlan` を置く。`betaId` は内部の定数にする。
  `collect.test.ts`: `normalPlan`、`betaPlan`、`betaId`、`betaFile` の定義を外し、`planId`、`adrNo`、`planFile`、`normalPlan` を fixture から import する。
  `cycleTree`: fixture の `normalPlan`/`betaPlan` を既定の plan にする。
  `PlanDocOptions` の `export` を外す。型は `planDoc` の引数として残す。
  ```
- `structure` の範囲
  ```text
  `close/scripts/cycle.fixture.ts` に FS を開く `cycleTree` を置く。
  `collect.fixture.ts` は文字列の fixture のままとする。
  `collect.test.ts` の `setupCycle` を削除し、6 本の FS テストを `cycleTree` に置き換える。
  `describe` は `planName`、`noOf`、`writeClose`、`collectPlan with review`、`collectPlan with Policy` のままにする。
  import の整理は plan で行う。
  ```
- `expression` の範囲
  ```text
  review 1 本目の名前を「review の指摘を `collectPlan` が拾い、`writeClose` が `## Collected` に書く」に変える。
  他のテスト名は変えない。
  `setupCycle` の名前は消え、`cycleTree` と `CloseCycleSpec` になる。
  ```
- `existing` の範囲
  ```text
  `cycleTree` に置き換える 6 本: `writeClose` の `collect.test.ts:51`、`59`、`66`、review の `80`、`100`、再実行の `118`。
  `cycleTree` を使わない: `planName`（31）、`noOf`（41）、`collectPlan with Policy`（147）。
  `collect.fixture.ts` に `planId`、`adrNo`、`planFile`、`betaFile`、`normalPlan`、`betaPlan` を置き、`PlanDocOptions` の `export` を外す。
  `close/scripts/cycle.fixture.ts` を新設し、`cycleTree` と `CloseCycleSpec` を置く。
  `collect.test.ts` の `setupCycle` と `normalPlan`/`betaPlan`/`betaId`/`betaFile` の定義を削除する。
  `writeClose` の `66-76` と `118-143` は `writeFileSync` を残し、再実行の 2 本目は `join(cycle, 'plan', '02-beta.md')` に書く。
  ```
- 残すエラー・空の確認
  ```text
  `planName` の error（`collect.test.ts:35-37`）。
  `noOf` の `No` 無し → `null`（`45-47`）。
  review の「なし」→ `## Collected` が「なし」（`100-116`）。
  `writeClose` の throw は追加も削除もしない。
  ```
- `verification` のコマンド
  ```text
  全件: `pnpm test:run`
  型: `pnpm typecheck`
  lint: `pnpm lint`
  ```

### Definition

- `Unit.close-skill`(kept): エージェントが、サイクル終了後に、クロージングできるという主機能は変わらず、変わるのはテストという検査の内容である。
- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取れるという主機能は変わらず、変わるのは走らせるテストの内容である。
- `Stack.Checks.Test runner`(kept): vitest のままで、テストの内容だけが変わる。

## 03: plan スクリプトのテスト整理

Type: _Full_

### Context

- C1: `.pi/skills/plan/scripts/index.test.ts` は 254 行で、`parseArgs`、`filesTree`、`planSkeleton`、CLI を確認している。`index.mjs` の usage は先頭のコメントにあり、`--root` を書いていないが、実装とテストは `--root` を使う。
- C2: このエントリでは振る舞いを変えない。usage の文言修正とテストの整理だけを行い、`index.mjs` と `plan.mjs` の出力を変えない。
- C3: ROADMAP 030 の意図は、不要なテストを整理することである。目的はテストを減らすことではなく、同じ事実を 1 か所で確認し、残すテストの意図が読める状態にすることである。プリンシプルの外にあるテストは削除する（オーナーの指示）。
- C4: 比較が必要な候補（F10）が見つかったため、オーナーの合意で Type は Full になった。
- C5: このエントリの問いは、`index.test.ts` のテストを点検し、usage の `--root` 欠落を直し、プリンシプル外のテストを削除できるかである。

### Research & Trial

- F1: `index.test.ts` の 12 `parseArgs`、3 `filesTree`、1 `planSkeleton`、5 CLI テストは、`plan.mjs` と `index.mjs` の現在の分岐に対応している。出所: `index.test.ts:9-254`
- F2: `index.mjs` の usage は `--root` を書いておらず、`-w`/`-b`、`--order` の 2 桁正規化、`--entries` の trim・重複除去、`root` の既定値、異常系も書いていない。実装とテストは `--root` を使う。`.pi/skills/plan/SKILL.md:57` も同じ usage を写している。出所: `index.mjs:1-5`, `plan.mjs:15,27-33,37,39,47-50,55,59`, `index.test.ts:180,206,217,228,239`, `.pi/skills/plan/SKILL.md:57`
- F3: `parseArgs --root` の単体テスト（`31-45`）は文字列の保持だけを見ており、CLI テストが `join(root, 'cycles')` への配線を確認している。出所: `index.test.ts:31-45,180`, `plan.mjs:31`, `index.mjs:45`
- F4: `filesTree` の「空 → なし」（`109-111`）は固定リテラル `'なし'` の写しで、「ルートの file」（`113-115`）は 1 要素の素通しである。出所: `index.test.ts:109-115`, `plan.mjs:111`
- F5: `planSkeleton` のテスト（`119-136`）は `id`/`No`/`Place`/`files` の補間と、固定見出しの `toContain` を混ぜている。`Inside`/`Outside`/`Notes`/`Round` 明細/`Acceptance` 明細は確認していない。出所: `index.test.ts:119-136`, `plan.mjs:120-175`
- F6: CLI の「plan を作る」（`174-200`）は配線（`openCycleDir`、`entryNumbers`、`readAffectedPaths`、`filesTree`、書き込み）を確認する一方、`# PLAN`、`No`、`Place`、`Goal`、`Slices` を単体テストと同じ文字列で再確認している。出所: `index.test.ts:174-200,119-136`
- F7: CLI の「place が base」（`202-211`）は `-b` の写像と `Place` の補間を単体テスト（`26-29`、`119-136`）と重ねて確認している。出所: `index.test.ts:26-29,119-136,202-211`
- F8: CLI の停止 3 テスト（`213-253`）は配線だけを確認しており、単体側に対応がない。出所: `index.test.ts:213-253`, `index.mjs:47,49-51,56`
- F9: すでに存在しない振る舞いを確認するテストはない。読まれない引数、使われない定数、参照のない export もない。出所: consult-3 の報告 3, 6
- F10: 単体テストと CLI テストの間で残す側を選ぶ比較がある（`parseArgs` 正常系、`filesTree`、`planSkeleton`、`--root`）。出所: consult-3 の報告 5
- `parseArgs` の未確認分岐（`missing value`/`too many` の `--root`、`--order`、`--place`、`--entries`、`too many plan ids`、`empty plan id`）と `index.mjs` の `missing affected` がある。出所: `plan.mjs:29-30,36,38,43,53-54,64-65`, `index.mjs:22`

### Scope

- In:
  - result: テストの集合、テストが確認する結果、`index.mjs` の usage の文を変える。製品の CLI の出力、エラー、ファイルの形は変えない。
  - logic: テストの判断と前提の組み立てを変える（同じ事実を確認する単体と CLI の統合）。
  - structure: テストファイル内の `describe`/`it` の分け方と import を変える。
  - expression: `index.mjs` と `SKILL.md` の usage の文、統合したテスト名を直す。
  - downstream: `.pi/skills/plan/SKILL.md:57` が usage を写しているため、`index.mjs` の usage と一緒に直す。
  - existing: 既存の `index.test.ts`、`index.mjs` の usage、`.pi/skills/plan/SKILL.md` の usage を更新する。
  - cost: テストの実行時間と行数が減る。製品の実行時の速度、メモリ、API 呼び出し、トークンは変えない。削減量は判断の基準にしない。
  - failure: `parseArgs` のエラーと CLI の停止を確認するテストは残す。
- Out:
  - upstream: 外部の package、contract、data source を変えない（対象はリポジトリ内のテストと usage だけである）。
  - safety: secret、permission、個人データに触れない（テストと usage の整理だけである）。
  - verification: 確認の手段（`pnpm test:run`、`typecheck`、`lint`）は変えない（テスト自体が成果物であり、手段ではない）。
  - observability: 製品の log、metric、監査記録を変えない（テストと usage の整理だけである）。
  - release: 公開、配布、適用、rollback の方法を変えない（git の変更だけである）。
  - other: なし（該当する関心事がない）。

### Decision

- Status: **accepted**
- Main: plan のテストが同じ事実を 1 か所で確認する形になり、`index.mjs` と `SKILL.md` の usage が `--root` と `-w`/`-b` を書き、単体と CLI の重複が消える（C1, C3, C4, C5, F10）
  - Add:
    - `index.mjs` の usage に `--root` を足し、`-w`/`-b` を `--place` の別名として書く（C2, F2）
    - `.pi/skills/plan/SKILL.md:57` の usage も同じ文に直す（C2, F2）
  - Update:
    - `parseArgs` の `--root` の単体テストを外し、CLI の `--root` に任せる（C3, F3）
    - `filesTree` の「空 → なし」と「ルートの file」を外し、ツリーの単体を残す（C3, F4）
    - `planSkeleton` のテストを、補間と見出しの構造に絞る（C3, F5）
    - CLI の「plan を作る」から `# PLAN`、`No`、`Place`、`Goal`、`Slices` の重複を外し、ファイルと Files ツリーの配線を残す（C3, F6）
    - CLI の「place が base」を外す（C3, F7）
    - 統合したテスト名を内容に合わせる（C2）
  - Drop:
    - `parseArgs` の `--root` の単体テスト（31-45）（C3, F3）
    - `filesTree` の「空 → なし」（109-111）と「ルートの file」（113-115）（C3, F4）
    - CLI の「place が base」（202-211）（C3, F7）
    - CLI の「plan を作る」の重複した値の断言（194-196、198-199）（C3, F6）
    - `planSkeleton` の個別の見出し・項目の文字列の断言（129-135）（C3, F5）
- Policy:
  - Allowed:
    - 単体と配線が同じ事実を確認する場合、判断・変換は単体に残し、配線は経路だけを確認する（C2, C3, F1, F10）
    - usage は `index.mjs` と `SKILL.md` の両方を直す（C2, F2）
    - `parseArgs` のエラーと CLI の停止は残す（C2, F8, F9）
    - すでに存在しない振る舞いのテストはないため、削除は重複と定数の整理に限る（C3, F9）
  - Forbidden:
    - 製品の CLI の出力、エラー、ファイルの形を変える - 振る舞いを変えないため（C2）
    - 同じ値の断言を単体と配線の両方に置く - 同じ事実を 2 か所で確認しないため（C3, F1）
    - usage を `index.mjs` だけ直して `SKILL.md` を残す - 記述が食い違うため（C2, F2）
    - テストを整理するために実装の振る舞いを変える - このサイクルの目的がテストの整理だから（C2）

#### Details

- `parseArgs` の `--root` の単体テスト
  ```text
  `index.test.ts:31-45` の `--root` の単体を削除する。
  root の配線は CLI の `--root` と `index.mjs:45` の `join(root, 'cycles')` に任せる。
  `parseArgs` の正常系（10-24）とエラー（47-95）は残す。
  ```
- `filesTree` の「空 → なし」と「ルートの file」
  ```text
  `index.test.ts:109-111` の「空 → なし」を削除する。
  `index.test.ts:113-115` の「ルートの file」を削除する。
  `index.test.ts:99-107` のツリーのテストを残す。
  ```
- `planSkeleton` の断言の絞り方
  ```text
  補間の 4 点（`# PLAN`、`- No`、`- Place`、Files のフェンス）を残す。
  見出しのリスト（`# PLAN`、`## Goal`、`## Design`、`## Files`、`## Slices`、`## Notes`、`## Work Review`、`### Round 1`、`### Round 2`、`## Acceptance`）を確認する。
  `- Boundary Plans:` と個別の見出しの `toContain` を外す。
  テスト名を「見出しの順と値を入れる」に変える。
  ```
- CLI の「plan を作る」の重複した値
  ```text
  `index.test.ts:194-196` と `198-199` の `# PLAN`、`- No`、`- Place`、`## Goal`、`## Slices` の断言を外す。
  `index.test.ts:193` のファイルの読み取りと `197` の Files ツリーを残す。
  ```
- CLI の「place が base」
  ```text
  `index.test.ts:202-211` のテストを削除する。
  `-b` の写像は `parseArgs` の単体（26-29）に残す。
  `Place` の値は `planSkeleton` の単体（119-136）に残す。
  CLI の `--place` の経路は「plan を作る」に残す。
  ```
- usage の文
  ```text
  node index.mjs <plan id> --order <NN> (--place <worktree|base> | -w | -b) --entries <NN[,NN...]> [--root <dir>]
  ```
- `structure` の範囲
  ```text
  `describe` は `parseArgs`、`filesTree`、`planSkeleton`、`CLI` のままにする。
  削除するテストは 4 本（`parseArgs` の `--root`、`filesTree` の 2 本、CLI の `place が base`）。
  `planSkeleton` は補間と見出しリストのテストに書き換える。
  `setupCycle` のローカル helper（139-169）は残す。新しい fixture は作らない。
  import は `tempDir`、`mkdirSync`、`writeFileSync` が `setupCycle` に残る。
  ```
- `expression` の範囲
  ```text
  `planSkeleton` のテスト名を「見出しの順と値を入れる」に変える。
  他の残るテスト名は変えない。
  `index.mjs` と `SKILL.md` の usage を L6 の文に揃える。
  ```

### Definition

- `Unit.plan-skill`(kept): エージェントが、1 plan 分の作業の形と順序を決めて書けるという主機能は変わらず、変わるのはテストと usage の文である。
- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取れるという主機能は変わらず、変わるのは走らせるテストの内容である。
- `Stack.Checks.Test runner`(kept): vitest のままで、テストの内容だけが変わる。
