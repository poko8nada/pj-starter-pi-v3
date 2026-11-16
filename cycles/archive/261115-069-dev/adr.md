# ADR 069

## 01: harness-sync のテスト整理と fixture の横断方針

Type: _Full_

### Context

- C1: 前提。`scripts/harness-sync/` の 6 テストファイル（collect、diff、display、list、path、index）のうち、collect、diff、list、index がそれぞれ `writeFile` を定義し、list と index が `writeJson` を定義している。`fakeRoot`、`pair`、`writeList`、`snapTree` は index だけが持つ。`test/scripts.fixture.ts` は表示行（`statusLine`、`countLine`、`indented` など）を持ち、`test/temp-dir.ts` は `tempDir()` を持つ。
- C2: 制約。テストの振る舞いは変えない。基準外のテストは削除する。過去のサイクルの記録は参照しない。fixture は、その Unit だけで使うものは Unit 内に、複数 Unit で使うものは `test/` に置く。
- C3: 意図。harness-sync のテストの前提を整理し、複数 Unit が使う helper を `test/scripts.fixture.ts` に集め、harness-sync だけが使う helper は harness-sync の側に残す。この線引きをサイクル全体の方向として決める。
- C4: 問い。どの前提を `test/scripts.fixture.ts` に集め、どれを harness-sync の側に残すか。単体と通しのどちらの確認を残すか。どのテストを基準外として削除するか。

### Research & Trial

- F1: `writeFile(abs, content)` が collect、diff、list、index の 4 ファイルに別定義され、`writeJson` が list と index に別定義される。`fakeRoot`、`run`、`pair`、`writeList`、`snapTree` は index だけが持つ。出所: `scripts/harness-sync/collect/index.test.ts:14`、`scripts/harness-sync/diff/index.test.ts:13`、`scripts/harness-sync/list/index.test.ts:14,19`、`scripts/harness-sync/index.test.ts:34,44,48,53,57,67,79`
- F2: collect の 6 本は `tempDir()` に `.pi/a.ts` を作り直し、diff の 2 本は `fromRoot` と `toRoot` の両方に `.pi/a.ts` を作り直し、list の 5 本は `setting.json` を書き直し、path の 6 本は `tempDir()` を呼び直し、index の多くの本は `origin`、`local`、`writeList` を作り直す。出所: `scripts/harness-sync/collect/index.test.ts:21,30,47,57,66`、`scripts/harness-sync/diff/index.test.ts:24,33`、`scripts/harness-sync/list/index.test.ts:28,41,47,53,60`、`scripts/harness-sync/path/index.test.ts:14,30,36,43,48,54`、`scripts/harness-sync/index.test.ts:115,127,139,162,198`
- F3: 単体と通しが同じ事実を確認している。missing は collect と index、copy は diff と index、同じ中身が copy にならないことは diff と index、表示行は display と index、壊れた一覧は list と index、starter 不在は path と index、starter 自身は path と index で重なる。方向選択と `--run` は通しだけが確認する。出所: `scripts/harness-sync/collect/index.test.ts:29-44`、`scripts/harness-sync/diff/index.test.ts:23-39`、`scripts/harness-sync/display/index.test.ts:19-43`、`scripts/harness-sync/list/index.test.ts:59-67`、`scripts/harness-sync/path/index.test.ts:43-66`、`scripts/harness-sync/index.test.ts:100-124,138-157,161-173,175-183,195-209,212-243`
- F4: `list` の「skip と legacy があっても返さない」は、`readList` が `skip` と `legacy` を読まず、`setting.json` にも両キーがない状態で、両キーが返らないことだけを確認している。出所: `scripts/harness-sync/list/index.test.ts:24-37`、`scripts/harness-sync/list/index.mjs:15-42`、`scripts/harness-sync/setting.json:1-34`
- F5: `path` の最後のテストは、同じ不在パスに対して `resolveStarter` を 2 回呼び、1 回目でメッセージと 1 行を確認し、2 回目で `toThrow` を確認している。出所: `scripts/harness-sync/path/index.test.ts:54-66`
- F6: collect の 6 本のうち 4 本が `missing: []` を、2 本が `paths: []` を確認し、1 本が `.pi/a.ts` と `.pi/sub/b.ts` の辞書順を確認する。display の 1 本が 5 行の順序を確認し、2 本が `no files missing` と `no files to copy` を確認する。出所: `scripts/harness-sync/collect/index.test.ts:26,33,42,53,61,62,70`、`scripts/harness-sync/display/index.test.ts:25-29,34-35`
- F7: index のエラー確認 3 本がエラー 1 行と stdout が空であることを確認し、same の 1 本が出力が 1 行であることを確認する。path の 1 本がエラー 1 行を確認する。出所: `scripts/harness-sync/index.test.ts:107,171,172,181,182,189,190,205`、`scripts/harness-sync/path/index.test.ts:64`
- F8: `collect` の `paths` は `scripts/harness-sync/index.mjs:110` で `diffPaths` に渡され、`missing` は `index.mjs:116` で exit 1 の判断に使われる。空の `missing` と `paths` は、copy と missing の分岐を決める値である。出所: `scripts/harness-sync/index.mjs:110,116`

### Scope

- In:
  - logic: 同じ事実を単体と通しの両方で確認している箇所を、単体に判断・変換を残し、通しは経路の確認だけに整理する。`list` の `skip` と `legacy` の確認、`path` の同じ例外の 2 回目の確認を削る。順序・有無だけの断言を見直す。
  - structure: 複数 Unit が使う `fakeRoot`、`writeFile`、`writeJson` を `test/scripts.fixture.ts` に移し、harness-sync だけが使う `run`、`pair`、`writeList`、`snapTree`、`errorLines` を harness-sync のテスト側に残す。4 つの `writeFile` と 2 つの `writeJson` の重複をなくす。
  - expression: テストファイルの先頭コメントと、`test/scripts.fixture.ts` の説明を、共有 helper に合わせて直す。
  - downstream: `test/scripts.fixture.ts` を参照する checks と product-ready の 5 ファイルが、既存の export をそのまま使えることを確かめ、02 と 03 が新しい helper を再利用できる形にする。
  - existing: 既存の harness-sync の 6 テストファイルを編集し、`skip` と `legacy` のテストを削除する。
  - cost: テスト本数が減る分だけ実行時間と読む量がわずかに減る（削減は目的ではない）。helper の管理が 1 か所に集まる。
- Out:
  - result: `scripts/harness-sync/index.mjs` の stdout、stderr、終了コード、写すファイルは変えない。
  - upstream: 依存パッケージ、外部の契約、データ源は変えない。
  - safety: 秘密、権限、露出、個人データに触れない。
  - failure: harness-sync のエラー経路（一覧の壊れ、starter 不在、向きの不在）と文言は変えない。削るのは重複した確認だけである。
  - verification: テストを走らせる手段（vitest、`pnpm test`、lefthook、レビューの手順）は変えない。変えるのはテストの中身だけである。
  - observability: ログ、メトリクス、監査記録は変えない。
  - release: 配布、公開、適用、巻き戻しの方法は変えない。
  - other: なし。

### Decision

- Status: **accepted**
- Main: harness-sync のテストの前提を整理し、複数 Unit が使う helper を `test/scripts.fixture.ts` に集め、harness-sync だけが使う helper を harness-sync の側に残す。単体と通しの重複を整理し、基準外のテストを削除する。（C4）
  - Add:
    - `test/scripts.fixture.ts` に `fakeRoot`、`writeFile`、`writeJson` を置く（C1, C3, F1, F2）
  - Update:
    - `collect`、`diff`、`list`、`index` のテストが共有 helper を使い、`pair()` が `copy` と `push` を受け取る（F1, F2）
    - `index` の copy と missing の確認は、単体の `diffPaths` と `collect` の判断を重ねず、通しの表示行と終了コードを確認する経路として残す（F3）
    - `index` のエラー確認 3 本は、エラー 1 行と stdout が空であることを確認する経路として残す（F7）
    - `collect` の `missing: []` / `paths: []` と `display` の行順は、`collect` と `display` の単体に残す（F6, F8）
    - テストファイルの先頭コメントと、`test/scripts.fixture.ts` の説明を、共有 helper に合わせて直す（C2）
  - Drop:
    - 4 つの `writeFile` と 2 つの `writeJson` の重複を削除する（F1）
    - `list` の「skip と legacy があっても返さない」を削除する（F4）
    - `path` の最後のテストにおける 2 回目の `resolveStarter` を削除する（F5）
- Sub: なし
- Policy:
  - Allowed:
    - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する（C2）
    - 複数 Unit が使う helper を `test/scripts.fixture.ts` に置く（C2, C3）
    - 基準外のテストを削除する（C2）
    - `pair()` のように harness-sync だけが使う helper を harness-sync の側に残す（C3）
  - Forbidden:
    - `scripts/harness-sync/index.mjs` の振る舞いを変えること - このエントリはテストの整理であり、製品の変更ではない（C2）
    - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である（C2）
    - `cycles/` の過去の記録を参照すること - オーナーの指示である（C2）
    - 02 と 03 の領域（checks、product-ready）のテストをこのエントリで変えること - それぞれのエントリの範囲である（C2）

#### Details

- `test/scripts.fixture.ts` の helper
  ```ts
  export function fakeRoot(): string;
  export function writeFile(root: string, rel: string, content = 'x\n'): string;
  export function writeJson(root: string, rel: string, data: unknown): void;
  ```
- `scripts/harness-sync/index.test.ts` の `pair`
  ```ts
  function pair(
    copy: readonly string[] = ['.pi'],
    push: readonly string[] = ['.pi'],
  ): { origin: string; local: string };
  ```

### Definition

- `Unit.harness-sync`(kept): テストの整理だけで、スターターとプロジェクトの間でハーネスを取り込む・戻す機能は変わらない。
- `Stack.Checks.Test runner`(kept): テストを走らせる手段は vitest のまま維持する。

## 02: checks のテスト整理

Type: _Full_

### Context

- C1: 前提。`scripts/checks/` の 3 テストファイル（ja-check 33 本、typecheck 6 本、typecheck-staged 4 本）が、それぞれ `fakeRoot` を定義し、`tempDir()` を使う。ja-check は `writeFile`、`writeConfig`、`validConfig` を持ち、typecheck は `stubTsc`、`writeTsconfig`、`writeScopes` を持ち、typecheck-staged は `stubTsc`、`writeFile`、`writeScopes` を持つ。typecheck は `test/scripts.fixture.ts` の `statusLine`、`OK`、`FAILED`、`INVALID_LIST_LINE` を使う。
- C2: 制約。テストの振る舞いは変えない。基準外のテストは削除する。過去のサイクルの記録は参照しない。fixture は、その Unit だけで使うものは Unit 内に、複数 Unit で使うものは `test/` に置く。01 が決めた線引きに従う。
- C3: 意図。checks のテストの前提を整理し、複数 Unit が使う `fakeRoot` と `writeFile` は 01 の共有 helper を使い、ja-check 固有の設定ファイルの書き込みと type-check 固有の tsc スタブは checks の側に残す。ja-check の重複を統合し、typecheck と typecheck-staged の同じ結果になる入力条件を 1 本に寄せる。
- C4: 問い。ja-check の 33 本のどれを統合し、どれを残すか。typecheck の「一覧が空」と「一覧のファイルがない」を 1 本にするか。typecheck-staged の 8 拡張子の列挙を残すか、削るか。

### Research & Trial

- F1: 3 テストファイルがそれぞれ `fakeRoot()`（`realpathSync(tempDir())`）と `run()` を定義し、`writeTsconfig` と `writeFile` は同じ内容であり、`writeScopes` は typecheck と typecheck-staged で二重に定義されている。出所: `scripts/checks/ja-check.test.ts:45-47`、`scripts/checks/typecheck.test.ts:35-39,42-57,59-63,65-69`、`scripts/checks/typecheck-staged.test.ts:33-37,40-53,55-64`
- F2: ja-check の 33 本のうち、単独引用の 3 本は引用符 1 文字だけが異なり、実装は 1 条件で 3 文字を扱う。`exclude: ['ROADMAP.md']` の 3 本は引数の形だけが異なり、実装は絶対化・相対化して同じ比較をする。出所: `scripts/checks/ja-check.test.ts:222-232,265-275,277-287,291-302,334-345,347-358`、`scripts/checks/ja-check.mjs:102-115,151`
- F3: typecheck の「一覧が空」と「一覧のファイルがない」は、どちらも `root: ok` だけを出して exit 0 になる。実装は空配列と ENOENT を同じ `scopes=[]` にする。一覧にあっても tsconfig がない範囲も同じ表示になる。出所: `scripts/checks/typecheck.test.ts:102-128,130-141`、`scripts/checks/typecheck.mjs:17-18,32,37-40`
- F4: typecheck-staged の `codeExtensions()` は実装の `CODE_EXTENSIONS` の 8 要素を先頭の `.` を除いて写し、テストはその 8 要素を順に試して `STUB_MARK` の有無を見る。両者の一致を保証する断言がない。出所: `scripts/checks/typecheck-staged.test.ts:67-69,78-95`、`scripts/checks/typecheck-staged.mjs:10,30,36-39`
- F5: 設定の誤りは、`exclude` の 3 態様、`exception` の 3 態様、余分な欄、`error` の型誤りと `extra` 混在、頂点の非レコード 3 入力の合計 9 本で、いずれもヘッダ 2 行と exit 1 だけを確認し、実装はすべて `failConfig()` に集まる。出所: `scripts/checks/ja-check.test.ts:360-372,374-382,384-392,441-470,472-483,484-492,494-502,504-512,514-524`、`scripts/checks/ja-check.mjs:21-25,48-81`
- F6: 順序・有無の確認として、ヘッダ順、`No config` がサマリーより前、`No config` / `No findings` / `files, error` の不在、前後 10 文字に切り詰めた断片と前後 15 文字が含まれないこと、`missing` / `scope` / `STUB_MARK` / `join(root, scope)` の不在がある。出所: `scripts/checks/ja-check.test.ts:83-88,260-261,408,420-425,437-438,454-455,468-469`、`scripts/checks/typecheck.test.ts:113,127,140`、`scripts/checks/typecheck-staged.test.ts:94,124`
- F7: `test/scripts.fixture.ts` の `statusLine`、`OK`、`FAILED`、`INVALID_LIST_LINE` は typecheck だけが使い、`test/temp-dir.ts` の `tempDir()` は 3 ファイルの `fakeRoot` 経由で使う。出所: `scripts/checks/typecheck.test.ts:14,82-83,98-99,112,126-127,139-140,152`、`scripts/checks/ja-check.test.ts:45-47`、`scripts/checks/typecheck-staged.test.ts:33-37`

### Scope

- In:
  - logic: 同じ事実を確認するテストを統合する。ja-check の単独引用 3 本を 1 本に、`exclude` のパス 3 形態を 1 本に、設定誤り 9 本を `exclude` と `exception` の対称形ごとに寄せる。typecheck の「一覧が空」と「一覧のファイルがない」を 1 本にする。typecheck-staged の 8 拡張子の列挙を、対象と対象外の 1 組に絞る。順序・有無だけの断言を見直す。
  - structure: 3 ファイルの `fakeRoot` と `writeFile` を 01 の `test/scripts.fixture.ts` の helper に置き換える。`stubTsc`、`writeScopes`、`writeConfig`、`validConfig` は checks の側に残し、typecheck と typecheck-staged の `stubTsc` / `writeScopes` / `writeTsconfig` の重複を checks の 1 つの helper に寄せる。
  - expression: 統合したテストの題名と、各テストファイルの先頭コメントを、残す事実と共有 helper に合わせて直す。
  - downstream: `test/scripts.fixture.ts` を参照する 5 ファイルと、`scripts/checks/ja-check.json` / `scopes.json` の使われ方を変えない。03 が同じ helper を使える形にする。
  - existing: 既存の checks の 3 テストファイルを編集する。`ja-check.mjs`、`typecheck.mjs`、`typecheck-staged.mjs`、`ja-check.json`、`scopes.json` は変えない。
  - cost: テスト本数が減る分だけ実行時間と読む量がわずかに減る（削減は目的ではない）。setup の管理が共有 helper と checks の 1 か所に集まる。
- Out:
  - result: `ja-check`、`typecheck`、`typecheck-staged` の stdout、stderr、終了コードは変えない。
  - upstream: 依存パッケージ、外部の契約、データ源は変えない。
  - safety: 秘密、権限、露出、個人データに触れない。
  - failure: 設定の誤り、一覧の壊れ、tsc の失敗のエラー経路と文言は変えない。削るのは重複した確認だけである。
  - verification: テストを走らせる手段（vitest、`pnpm test`、lefthook、レビューの手順）は変えない。変えるのはテストの中身だけである。
  - observability: ログ、メトリクス、監査記録は変えない。
  - release: 配布、公開、適用、巻き戻しの方法は変えない。
  - other: なし。

### Decision

- Status: **accepted**
- Main: checks のテストの前提を整理し、複数 Unit が使う `fakeRoot` と `writeFile` を 01 の共有 helper に置き換え、checks だけが使う `stubTsc`、`writeScopes`、`writeConfig`、`validConfig` を checks の側に残す。同じ事実を確認するテストを統合し、実装の定数を写すだけの確認を削除する。（C4）
  - Add:
    - `scripts/checks/checks.fixture.ts` に `stubTsc` と `writeScopes` を置く（C1, C3, F1）
  - Update:
    - ja-check の単独引用 3 本を 1 本に、`exclude` のパス 3 形態を 1 本に、設定誤り 9 本を 6 本に統合する（F2, F5）
    - typecheck の「一覧が空」と「一覧のファイルがない」を 1 本にし、`writeTsconfig` を共有 `writeFile` にする（F1, F3）
    - typecheck-staged の 8 拡張子の列挙を、対象と対象外の 1 組に絞る（F4）
    - 3 ファイルの `fakeRoot` と `writeFile` を 01 の共有 helper に置き換え、`stubTsc` と `writeScopes` を `checks.fixture.ts` から利用する（F1, F7）
    - 統合したテストの題名と、各テストファイルの先頭コメントを直す（C2）
  - Drop:
    - 3 つの `fakeRoot`、ja-check と typecheck-staged の `writeFile`、2 つの `stubTsc`、2 つの `writeScopes`、`writeTsconfig`、`codeExtensions()` を削除する（F1, F4）
    - 単独引用 2 本、`exclude` のパス 2 本、設定誤り 3 本、typecheck の一覧のファイルがない場合の 1 本を削除する（F2, F3, F5）
    - `ja-check.test.ts` の `h2At > h1At` の重複した断言を削除する（F6）
- Sub: なし
- Policy:
  - Allowed:
    - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する（C2）
    - 複数 Unit が使う `fakeRoot` と `writeFile` は 01 の `test/scripts.fixture.ts` を使う（C2, C3）
    - checks だけが使う helper は `scripts/checks/` の側に置く（C3）
    - 基準外のテストを削除する（C2）
    - checks の `stubTsc` は `STUB_FAIL` を見る 1 バージョンにし、typecheck-staged は `STUB_FAIL` を設定しない（C3, F1）
    - 順序・有無の断言のうち、出力の表示内容とフィルタの振る舞いを確認するものは残す（F6）
  - Forbidden:
    - `scripts/checks/*.mjs` と `ja-check.json`、`scopes.json` の振る舞いを変えること - このエントリはテストの整理である（C2）
    - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である（C2）
    - `cycles/` の過去の記録を参照すること - オーナーの指示である（C2）
    - 01 と 03 の領域のテストをこのエントリで変えること - それぞれの範囲である（C2）

#### Details

- 単独引用の 3 文字を報告しないテスト
  ```ts
  it('単独引用の error 語 → 報告しない（3 つの引用符）', () => {
    for (const quote of ["'", '`', '"']) {
      const root = fakeRoot();
      writeConfig(root, validConfig());
      const file = writeFile(root, 'a.md', `${quote}${ERROR_WORD}${quote}\n`);
      const out = run(root, [file]);
      expect(out.status).toBe(0);
      expect(out.stdout).not.toContain('[error]');
      expect(out.stdout).toContain('ja-check: No findings.');
      expect(out.stdout).toContain('ja-check: 1 files, error 0, warn 0.');
    }
  });
  ```
- `scripts/checks/checks.fixture.ts`
  ```ts
  export function stubTsc(root: string): void;
  export function writeScopes(root: string, scopes: readonly string[]): void;
  ```

### Definition

- `Unit.japanese-check`(kept): テストの整理だけで、日本語の指摘は変わらない。
- `Unit.type-check`(kept): テストの整理だけで、型の指摘は変わらない。
- `Stack.Checks.Test runner`(kept): テストを走らせる手段は vitest のまま維持する。

## 03: product-ready のテスト整理

Type: _Full_

### Context

- C1: 前提。`scripts/product-ready/` の 3 テストファイル（cli 14 本、index 28 本、targets 13 本）のうち、index の多くの `it` が `makeTree()` と `run()` を呼び、同じツリーを毎回作る。`makeTree()` は `writeFile`、`writePackageJson`、`writeVitestConfig`、`writeTestExclude`、`writeReplaceTargets` を組み合わせる。targets は「at の昇順」「labels の並び」を確認するテストを持つ。`test-exclude.json` の実物を確認するテストが、同ファイルが `settings.fixture` を含み `pi.fixture` を含まないことを確かめている。`test/pi.fixture.ts` は存在しない。
- C2: 制約。テストの振る舞いは変えない。基準外のテストは削除する。過去のサイクルの記録は参照しない。fixture は、その Unit だけで使うものは Unit 内に、複数 Unit で使うものは `test/` に置く。01 が決めた線引きに従う。
- C3: 意図。product-ready のテストの前提を整理し、`makeTree()` と `run()` の繰り返しを 1 つの helper に寄せる。順序・定数の確認と、すでに存在しない `pi.fixture` がないことの確認を削る。同じエラー経路を 1 本に寄せる。
- C4: 問い。`makeTree()` と `run()` をどこまで 1 つの helper に寄せるか。targets の順序・定数のテストのどれを削るか。index の同じエラー経路のどれを残すか。

### Research & Trial

- F1: index の 28 本のうち 26 本が `makeTree()` と `run()` を呼び、同じツリーを毎回作る。例外は最小ツリーの 1 本と、実物 `test-exclude.json` を読む 1 本である。出所: `scripts/product-ready/index.test.ts:165-188,381-388,590-598`
- F2: `targets` の「at の昇順」は実装の `toSorted` の並びを確認し、「labels の並び」は `LABELS` 定数の写しを確認する。`cli` の「空の label は 1 行、並びは labels のまま」と「label ごとにまとめ、at を出す」は、入力順の維持と label ごとの並べ替えを確認する。出所: `scripts/product-ready/targets.test.ts:58-73,124-136`、`scripts/product-ready/targets.mjs:36-39,137,175-181`、`scripts/product-ready/cli.test.ts:51-91`、`scripts/product-ready/cli.mjs:58-70`
- F3: 実物 `test-exclude.json` のテストは、実物の配列が `test/settings.fixture.ts` を含み `test/pi.fixture.ts` を含まないことを確認する。実物は 7 要素で、`test/` は `test/scripts.fixture.ts`、`test/settings.fixture.ts`、`test/temp-dir.ts` の 3 ファイルだけで、`test/pi.fixture.ts` は存在しない。出所: `scripts/product-ready/index.test.ts:590-598`、`scripts/product-ready/test-exclude.json:1-9`、`test/scripts.fixture.ts`、`test/settings.fixture.ts`、`test/temp-dir.ts`
- F4: JSON のエラー 4 本（壊れ、なし、配列でない、要素が文字列でない）は、いずれも status 1、エラー 1 行、`the test exclude is not valid:` を含むことを確認する。実装は読み込み失敗・JSON 失敗・形の失敗を同じ文言で投げる。README のエラー 3 本（`## What is in it` なし、段落なし、`###` が 1 つだけ）は、いずれも status 1、エラー 1 行、ツリーが変わらないことを確認する。出所: `scripts/product-ready/index.test.ts:225-238,431-474,507-579`、`scripts/product-ready/index.mjs:121-138,263-279`
- F5: エラー時の「ツリーは変わらない」は、`existsSync(cycleA)`、`beforeConfig` の一致、`readTargets` の一致、エラー 1 行、`output ''` の組合せで繰り返されるが、確認範囲は本ごとに異なる（`--only` 値なしは cycleA だけ、`## Product` なしは cycleA を確認せず、`###` が 1 つだけの本は `output ''` を確認しない）。出所: `scripts/product-ready/index.test.ts:231-237,293-312,326-335,364-378,391-428,431-474,507-578`
- F6: 順序・有無の確認として、`switchLines` の 2 行、`## What is in it` < `### Product` < `### Default`、`headings:` の順序と不在、`### Default` 下の 5 行、`headings:` の表示、`no replace to replace` がある。出所: `scripts/product-ready/cli.test.ts:13-26`、`scripts/product-ready/cli.mjs:46-48`、`scripts/product-ready/index.test.ts:278-290,338-361,381-388,477-504,581-585`
- F7: `blocks.mjs` には専用のテストファイルがなく、index の子プロセス経由でだけ実行される。`cli.test.ts` の `parseArgs` は index の子プロセス経由の `exit 1` と重なるが、観測点は戻り値・例外の送出と終了コード・標準エラーで異なる。出所: `scripts/product-ready/blocks.mjs:14-59`、`scripts/product-ready/cli.test.ts:103-138`、`scripts/product-ready/index.test.ts:364-378`

### Scope

- In:
  - logic: `makeTree()` と `run()` を各 `it` が呼び、同じツリーを毎回作る箇所を、1 つの helper に寄せる。`targets` の at の昇順の重複した断言、`labels` の定数の並び、`cli` の `switchLines` の 2 行、`index` の `headings` の順序と不在を見直す。実物 `test-exclude.json` の `pi.fixture` の不在の確認を削除する。同じエラー経路（JSON 4 本、README 3 本）と「ツリーは変わらない」の同形断言を見直す。
  - structure: `index.test.ts` の `makeTree()`、`run()`、`writeRules`、`writeReplaceTargets`、`writeTestExclude`、`writePackageJson`、`writeVitestConfig` を 1 つの setup helper に寄せる。`fakeRoot`、`writeFile`、`writeJson` は 01 の `test/scripts.fixture.ts` を使う。`makeTree()` のルートを共有 `fakeRoot` にするか `tempDir()` のままにするか、`targets` の `tempDir()` の扱いを決める。
  - expression: 統合したテストの題名と、`makeTree()` の説明、各テストファイルの先頭コメントを直す。
  - downstream: `test/scripts.fixture.ts` を参照する 5 ファイル、`scripts/product-ready/test-exclude.json`、`rules/` のテンプレート、`vitest.config.ts` の目印の使われ方を変えない。
  - existing: 既存の product-ready の 3 テストファイルを編集する。`index.mjs`、`cli.mjs`、`targets.mjs`、`blocks.mjs`、`test-exclude.json` は変えない。
  - cost: テスト本数が減る分だけ実行時間と読む量がわずかに減る（削減は目的ではない）。`makeTree()` の管理が 1 か所に集まる。
- Out:
  - result: `product-ready` の stdout、stderr、終了コード、書き換えるファイルは変えない。
  - upstream: 依存パッケージ、外部の契約、データ源は変えない。
  - safety: 秘密、権限、露出、個人データに触れない。
  - failure: JSON の誤り、目印の不在、README の形のエラー経路と文言は変えない。削るのは重複した確認だけである。
  - verification: テストを走らせる手段（vitest、`pnpm test`、lefthook、レビューの手順）は変えない。変えるのはテストの中身だけである。
  - observability: ログ、メトリクス、監査記録は変えない。
  - release: 配布、公開、適用、巻き戻しの方法は変えない。
  - other: なし。

### Decision

- Status: **accepted**
- Main: product-ready のテストの前提を整理し、`makeTree()` と `run()` の繰り返しを 1 つの setup helper に寄せ、共有 `fakeRoot` / `writeFile` / `writeJson` を使う。順序・定数の確認、すでに存在しない `pi.fixture` の不在の確認、同じエラー経路の重複を整理し、基準外のテストを削除する。（C4）
  - Add:
    - `index.test.ts` に `runOnTree(args)`、`snapshot(tree)`、`expectUnchanged(tree, before)` を置く（C1, C3, F1, F5）
  - Update:
    - `index.test.ts` の 26 本の `makeTree()` と `run()` を `runOnTree(args)` に置き換え、`makeTree()` のルートを `fakeRoot()` にする。JSON の形の統合で 1 本減り、`runOnTree` は 25 本になる（F1）
    - `index.test.ts` のローカル `writeFile` / `writeText` を共有 `writeFile` に、`writePackageJson` / `writeTestExclude` を共有 `writeJson` に置き換える（F1）
    - `cli.test.ts` の `switchLines` の 2 本を 1 本に統合する（F6）
    - `index.test.ts` の JSON の「配列でない」と「要素が文字列でない」を 1 本に統合する（F4）
    - `index.test.ts` の「ツリーは変わらない」を `expectUnchanged` に寄せる（F5）
  - Drop:
    - `targets.test.ts` の `labels` 2 本と、at の昇順の 2 つ目の断言を削除する（F2）
    - `index.test.ts` の実物 `test-exclude.json` の 1 本を削除する（F3）
    - `cli.test.ts` の `switchLines` の 1 本を削除する（F6）
    - `index.test.ts` の JSON の形の 1 本を削除する（F4）
    - `index.test.ts` のローカル `writeFile` / `writeText` を削除する（F1）
- Sub: なし
- Policy:
  - Allowed:
    - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する（C2）
    - `index.test.ts` の `runOnTree` と `expectUnchanged` を使う（C1, C3）
    - 共有 `fakeRoot` / `writeFile` / `writeJson` を使う（C2, C3）
    - `targets.test.ts` は `tempDir()` のままにする（C2）
    - 基準外のテストを削除する（C2）
    - 順序・有無の断言のうち、出力の表示内容を確認するもの（`## What is in it` < `### Product` < `### Default`、`headings` の順序と不在、`### Default` の 5 行、`no replace to replace`）は残す（F6）
    - `cli.test.ts` の `parseArgs` と `index` の子プロセスの `exit 1` は、観測点が違うため両方残す（F7）
  - Forbidden:
    - `scripts/product-ready/*.mjs` と `test-exclude.json` の振る舞いを変えること - このエントリはテストの整理である（C2）
    - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である（C2）
    - `cycles/` の過去の記録を参照すること - オーナーの指示である（C2）
    - 01 と 02 の領域のテストをこのエントリで変えること - それぞれの範囲である（C2）
    - `rules/` のテンプレートと `vitest.config.ts` の目印を変えること - テストの前提である（C2）
    - `blocks.mjs` の専用テストを追加すること - このエントリは整理であり、追加は範囲外である（F7）

#### Details

- `scripts/product-ready/index.test.ts` の helper
  ```ts
  function runOnTree(args: readonly string[]): { tree: Tree; result: RunOut };
  function snapshot(tree: Tree): Before;
  function expectUnchanged(tree: Tree, before: Before): void;
  ```

### Definition

- `Unit.product-ready`(kept): テストの整理だけで、ハーネスのテストを外してプロダクト開発を始める機能は変わらない。
- `Stack.Checks.Test runner`(kept): テストを走らせる手段は vitest のまま維持する。
