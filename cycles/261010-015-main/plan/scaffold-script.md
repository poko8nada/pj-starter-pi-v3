# PLAN `scaffold-script`

## Files

```text
.pi/skills/definition/
  scripts/
    scaffold.mjs              update
    scaffold.test.ts          add
  SKILL.md                    update
  references/
    format.md                 update
lib/
  git-env.mjs
```

## Slices

1. rule とテスト
   - I/O:
     ```js
     slugBranch(branch: string): string  // 戻り値は slug（[a-z0-9-]、端なし、空なし）。"" → no-branch はここだけが落とす
     toYYMMDD(date: Date): string  // ローカル日付の YYMMDD
     nextNNN(names: readonly string[]): number  // 両根を合流させた名前の並びから次番号。新形・旧形を数値で拾い、合わない物は飛ばす。空 → 1
     cycleDirName(nnn: number, yymmdd: string, slug: string): string  // 0 埋めはここがやる
     findPrevDefinition(cyclesDir: string, archiveDir: string): string | null  // NNN 降順に definition.md を探す。同 NNN は live 優先、同根・同 NNN は名前順。無ければ null
     parseArgs(argv: readonly string[]): { root: string, src: string | null }  // root 既定は cwd。`--root` 値欠落・未知引数・位置引数 2 個以上は投げる。src の存在確認はしない（CLI が読む）
     createLeafDir(parentDir: string, name: string): string  // 非 recursive で葉だけ作り、path を返す。存在すれば EEXIST で投げる
     ```
   - Verify:
     - test: `pnpm vitest run .pi/skills/definition/scripts/scaffold.test.ts`
       - (happy) `slugBranch("main")` → `"main"`、`slugBranch("develop")` → `"dev"`、`slugBranch("feature/a/b")` → `"feat-a-b"`、`slugBranch("fix/x")` → `"fix-x"`
       - (happy) `slugBranch("Fix/X")` → `"fix-x"`、`slugBranch("2-consult.retry")` → `"2-consult-retry"`
       - (happy) `toYYMMDD(new Date(2026, 9, 10))` → `"261010"`
       - (happy) `nextNNN(["001-2026-09-20", "261010-015-main", "archive"])` → `16`
       - (happy) `cycleDirName(16, "261010", "main")` → `"261010-016-main"`、`cycleDirName(5, "261010", "main")` → `"261010-005-main"`
       - (happy) `parseArgs(["--root", "/tmp/x"])` → `{root: "/tmp/x", src: null}`、src 付きは src が入る
       - (happy) `stripMarkers("a **add** (ADR 01-1)")` → `"a"`。marker 無し → そのまま
       - (happy) tmp の両根に definition がある木 → NNN が最大の `definition.md` を返す。max-NNN の dir に無い時は番号を下がって探す。同 NNN 並立では live が勝つ。同根・同 NNN では名前順に先の `definition.md` を返す
       - (boundary) `slugBranch("")` → `"no-branch"`、`slugBranch("日本語/x")` → `"x"`、`slugBranch("///")` → `"no-branch"`、`"x".repeat(80)` → 80 個の `x`
       - (boundary) `parseArgs([])` → src は `null`（root は cwd なので値は見ない）
       - (empty) `nextNNN([])` → `1`。definition が無い木 → `findPrevDefinition` は `null`
       - (error) `parseArgs(["--bogus"])` → 投げる。`parseArgs(["--root"])` → 投げる。`parseArgs(["a", "b"])` → 投げる
       - (happy) 空 tmp に `createLeafDir` で作る → path が返り dir ができる
       - (error) 既存 dir に `createLeafDir` → EEXIST で投げる（code が EEXIST であること）
   - Steps:
     1. `scaffold.mjs`: 純関数7つを足す。既存の export（`stripMarkers`、`TEMPLATE_001`）は保つ。slug は完全一致・先頭セグメント・sanitize の順で決め、結合してから `-` の連続と端を除去し、空なら `no-branch`（`""` の判定はここだけ。CLI は空文字をそのまま渡す）。`toYYMMDD` はローカル getter で組み立てる。NNN 抽出は新形 `^\d{6}-(\d{3})-` を先に、旧形 `^(\d{3})-` を後に、それ以外は飛ばす。`findPrevDefinition` は両根の dir を NNN 降順に `definition.md` を探し、無ければ `null`。`createLeafDir` は非 recursive で葉だけ作り path を返す（存在すれば EEXIST で投げる）
     2. `scaffold.test.ts`: 上のケースを書く。`findPrevDefinition` の木は `test/tmp.ts` の `tmpDir` で作る（`targets.test.ts` の流儀）
2. CLI と手順
   - I/O:
     ```js
     // argv: [--root <dir>] [<src>]（root 既定は cwd）
     // roots: root/cycles + root/cycles/archive（存在しない根は空として扱う）
     // branch: `git branch --show-current`（`gitEnv` 経由、`cwd` は root。空文字はそのまま slugBranch へ）
     // date: toYYMMDD(new Date())
     // exists: 親 cycles/ は mkdir recursive。葉は非 recursive で作り、EEXIST は `exists: <path>` を出して exit 1（存在確認の先読みはしない。同時通過の競合を葉の原子性で受けるため）
     // src: 相対は root 基準で解決。読みの ENOENT はそのまま投げる
     // out: 作った dir と使った src（または template）を印字。exit 0
     ```
   - Verify:
     - cli: tmp に木を作り（`git init` + 空 commit + `git checkout -b feature/x`。`<tmp>/cycles/` 下に live（max `015`、定義付き）と `<tmp>/cycles/archive/`（max `014`、定義付き）を置く）、`node .pi/skills/definition/scripts/scaffold.mjs --root <tmp>` を走らせる
       - (happy) 上の木 → `^\d{6}-016-feat-x$` のフォルダができ、live `015` の definition の中身がそのまま持ち越され、印字が作った dir と使った src を指す
       - (happy) 明示 src（marker 付き）に絶対 path と root 基準相対 path を渡す → marker が落ちた草案ができる（中身で確かめる）
       - (error) 存在しない src → 投げて非 0 終了
       - (boundary) 空の木 → `TEMPLATE_001` の草案ができる
       - (boundary) 同上構成で `git checkout --detach` した木 → `^\d{6}-016-no-branch$` のフォルダができる
       - (error) `toYYMMDD(当日) + "-016-feat-x"` の期待 dir 名を事前に mkdir した木 → exit 1、`exists:` の行が出る（当日実行が前提。日跨ぎしたら求め直す）
       - `grep -c "scaffold.mjs <dest>" .pi/skills/definition/SKILL.md` → 0。`grep -n "node .pi/skills/definition/scripts/scaffold.mjs" .pi/skills/definition/SKILL.md` → 引数なしの呼び出しがある
       - `grep -n "cycles/" .pi/skills/definition/references/format.md` → path 行が `cycles/<YYMMDD-NNN-<branch>>/definition.md`
       - `grep -n "cycles/" .pi/skills/definition/SKILL.md` → :3 と :16 が新形 `cycles/<YYMMDD-NNN-<branch>>/definition.md` で、旧 3 形が 0 件
       - `grep -rn "scaffold.mjs <dest>" .pi/ scripts/ lib/ test/` → 0 件
   - Steps:
     1. `scaffold.mjs`: CLI を wire する。`parseArgs`（slice 1）で引数を読む。`--root` から両根を作り、存在しない根は空として扱う。親を作ってから葉は `createLeafDir` で作り、catch EEXIST → `exists:` + exit 1（I/O の通り、変えない）。branch・日付・探索・草案・印字は I/O の通り。src 相対は root 基準。旧 `<dest> [<src>]` 形の呼び出しが他に無いことを grep で確かめる
     2. `SKILL.md`: 手順1を新しい呼び出しに書き換える（引数なしでフォルダまで作り、印字された path を使う）。ついでに :3（description）と :16（path 行）も新形に直す
     3. `format.md`: path 行を新形 `cycles/<YYMMDD-NNN-<branch>>` に直す
3. 統合: 素起こしが一つの呼び出しになる
   - Verify:
     - cli: tmp に repo の `cycles/` を模した木（live: 定義無しの `261010-015-main` + archive: 定義付きの `001-2026-09-20`、`014-2026-10-09`、git repo 化 + `git checkout -b feature/x`）を作り実行
       - `^\d{6}-016-feat-x$` のフォルダができ、持ち越し元が archive の `014-2026-10-09/definition.md` になる（live に無いので archive が勝つ。中身で確かめる）
       - `pnpm vitest run .pi/skills/definition/scripts/scaffold.test.ts` が緑のまま
   - Steps:
     1. `scaffold.mjs`: slice 1–2 の残りがあれば閉じる（残り物はないはず）
     2. `scaffold.test.ts`: 同上

## Notes

### Slice 1: rule とテスト

- Findings: なし
- Unplanned: なし
- Commit: b066190
- 追加対応: `createLeafDir` を純関数に切り出し、CLI の葉作成に使用。単体テスト happy（path 返却＋dir 作成）と error（EEXIST の code 確認）を追加。17 tests 緑
- Commit（追加）: 1593ca7

### Slice 2: CLI と手順

- Findings:
  - `exists:` の事前 mkdir 再現が衝突に落ちない: 期待 dir `016` を事前に作ると max が `016` になり次は `017` を作るため、葉の EEXIST に当たらない。並行 2 実行も直列化され `016`/`017` ができ `exists:` は出ない
    left: max+1 の算出では事前作成が次番号を押し上げるため、単純な事前 mkdir では再現できない。同時通過の競合を決定的に起こす手順が無い
- Unplanned: なし
- Commit: 8845b93
- 追加対応: `SKILL.md` :3（description）と :16（path 行）を新形に修正。`grep -n "cycles/"` で :3・:16 が新形、旧 3 形 0 件を確認
- Commit（追加）: 1593ca7

### Slice 3: 統合: 素起こしが一つの呼び出しになる

- Findings: なし
- Unplanned: なし
- Commit: fb79fd1

## Review

### Round 1

- Stale: なし（review の子は Shapes/Checks/Files で見て Stale の指摘なし。既存 export の扱いは変えない）
- Unlisted: なし（review の子が Files 完全を確認。`lib/git-env.mjs` は関連ファイルとして載せ済み）
- Gaps:
  - slice 2 に I/O が無く CLI の署名・状態が覆われていない
    - fixed: slice 2 に CLI の I/O（引数・branch・日付・exists・印字・exit）を足し、`parseArgs` は slice 1 の純関数にした
  - 両根合流の shape が無く `findPrevDefinition(cyclesDir 単数)` では ADR の両根探索を実装できない
    - fixed: `findPrevDefinition(cyclesDir, archiveDir)` の 2 引数にし、合流の扱いを Steps に書いた
  - `mkdir recursive:true` と EEXIST が両立しない（recursive では投げない）のに存在確認の shape が無い
    - fixed: 存在確認を別にして先にやり、`exists:` + exit 1 にした
  - 日付生成が CLI 直書きで純関数の shape が無い
    - fixed: 純関数 `toYYMMDD` に出した
  - pad 所有が不明（`nextNNN` は number 返却、`cycleDirName` は number 受け）
    - fixed: `cycleDirName` が 0 埋めすると明記し、フル引数のケースを足した
  - 空→no-branch が `slugBranch` と CLI に二重にある
    - fixed: `slugBranch` だけが落とし、CLI は空文字をそのまま渡すことにした
  - slice 1 (error) が入力→結果の形でなくそのまま実行できない
    - fixed: 具体ケース（合わない名前は飛ばす、`"///"` → no-branch）に書き直した
  - `5→005` が引数不足・対象不明でそのまま実行できない
    - fixed: `cycleDirName(5, "261010", "main")` → `"261010-005-main"` にした
  - `fixture は要らない` が `findPrevDefinition` の fs 読みと矛盾する
    - fixed: `test/tmp.ts` の `tmpDir` で木を作ることにした
  - slice 2 の CLI 3 件が日付・branch 依存で固定されず、tmp 木の作り方が無い
    - fixed: branch を `feature/x` に固定し、dir 名は正規表現 + 中身の完全比較にした
  - exists: が recursive では起きず再現手順が無い
    - fixed: 存在確認を別にし、再現手順（期待 dir を事前に mkdir）を書いた
  - 任意 `[<src>]` の present 側（明示 src）のケースが無い
    - fixed: marker 付き src のケースを足した
  - 文書変更（SKILL 手順1・format path 行）に確認が無い
    - fixed: grep のケースを slice 2 の cli Verify に足した
  - slice 3 の入力・対象が未固定
    - fixed: 木の中身・branch・期待名・対象テストを全て固定した
  - detached HEAD の CLI が無く Design の Env 境界を覆わない
    - fixed: boundary ケースを足した
  - `cycleDirName` の happy が無く組立の有無を分けられない
    - fixed: `(16, "261010", "main")` → `"261010-016-main"` を足した

### Round 2

- Stale: なし（review の子が確認。旧 `<dest> [<src>]` への言及は置換要求なので Stale ではない）
- Unlisted: なし（review の子が確認。`test/tmp.ts` は流儀参照で Files 追加不要、`memo-015-slug.mjs` と `product-ready` は対象外が正しい）
- Gaps:
  - tmp 木・持ち越し元の固定が残る（archive 側 NNN 未固定、live 定義の有無が不明、detached の構成不明、期待 dir 名の算出法が無い）
    - fixed: archive（max `014`）と live（max `015`、定義付き）を固定し、slice 3 は live 定義無しと明記して archive が勝つ形にした。detached は同上構成で期待名を固定し、期待 dir 名は `toYYMMDD(当日)` で求めると書いた
  - `mkdir recursive:true` が ADR の衝突受けを壊す（存在確認の先読みは同時通過に負ける）
    - fixed: 親だけ recursive、葉は非 recursive に直した。先読みはしない。EEXIST が原子に落ちる
  - `root` → 2 根の導出が無い
    - fixed: I/O と Steps に `root/cycles` + `root/cycles/archive`（存在しない根は空）を足し、Verify の木の配置も明記した
  - `parseArgs`・`src` の境界が未規定（値欠落、相対解決、存在しない src）
    - fixed: 値欠落と未知引数は投げると明記し、src 相対は root 基準、存在しない src は読みで投げると決めてケースを足した
  - 文書・旧形式の Verify が合否判定できない
    - fixed: `grep -c` → 0 と期待行の `grep -n` にし、repo-wide の旧形 grep を足した
  - 80 文字境界の入力が未固定
    - fixed: `"x".repeat(80)` → 80 個の `x` にした

### Round 3 (diff `f0fb6fd..HEAD`: `b066190`, `8845b93`, `fb79fd1`, `1593ca7` を review)

- Stale: なし（旧 `<dest>` 形の残存なし。slice 2 の repo-wide grep が 0 を要求し、現状の `scaffold.mjs` 言及は `SKILL.md:41`（新形）・`scaffold.mjs:8`（新形）のみ。他スキルの `cycles/<NNN-YYYY-MM-DD>` 残存は本 change 前からあり Design `path-and-archive` の守備範囲なので本 change が stale にしたものではない。ADR Highlight の「フォルダは作らない」は決定前の現状記録で凍結対象）
- Unlisted: なし（`git diff --name-status f0fb6fd..HEAD` の変更は `SKILL.md`・`format.md`・`scaffold.mjs`・`scaffold.test.ts`・plan md の 5 件のみ。前 4 件は ## Files の 4 行に載り、plan md は計画自体。`lib/git-env.mjs` と `test/tmp.ts` は import されるだけで無変更）
- Gaps:
  - CLI の EEXIST → `exists:` + exit 1 写像を起こす check が無い。`scaffold.mjs:250-258`（親 recursive＋葉 `createLeafDir`、catch EEXIST で `exists:`）に対し、slice 2 Verify の事前 mkdir 手順は Notes Slice 2 Findings の `left:` 通り max+1 が `016` → `017` に逃げて葉に当たらない。単体 `createLeafDir` EEXIST（`scaffold.test.ts:104-114`）は葉の throw だけを見て CLI の catch 写像を見ない
    - left: CLI 通しの再現は不可。葉の EEXIST は単体テスト済みで catch は読みで正しい
  - `parseArgs` の 2 つ目位置引数 `too many arguments`（`scaffold.mjs:213`）に check が無い。slice 1 Verify は `--bogus` と `--root` 値欠落だけ（plan:43）で二重 src の error ケースが無い。I/O（plan:27）は単一 src を仮定するだけで多引数の扱いを決めていない
    - fixed: 余分な位置引数は未知引数と同様に投げることにし、`parseArgs(["a", "b"])` が投げるケースを足した（実装は既存の `too many arguments` のまま）
  - 同一 NNN での live/archive 優先と同根同 NNN の name 順（`scaffold.mjs:153-155,172-175` の priority＋name 降順）に check が無い。slice 1 の `findPrevDefinition` 3 件も slice 3 も NNN が異なる木（`015` vs `014`）だけで同 NNN 並立の木が無い。I/O（plan:26）は NNN 降順のみで tie-break を決めていない
    - fixed: 同 NNN では live が archive に勝つケース（両根に `015` を置き内容で判定）を足した（実装の priority 順のまま）
- Unproven:
  - `toYYMMDD` の月日 `padStart(2, '0')`（`scaffold.mjs:101-103`）。test（`scaffold.test.ts:44-48`）は `new Date(2026, 9, 10)` → `"261010"` のみで月日とも 2 桁のため、pad を外しても緑のまま。一桁月日（例 `260105`）のケースが無い
    - fixed: `new Date(2026, 0, 5)` → `"260105"` のケースを足した
  - `nextNNN` の旧形分岐（`extractNNN` の `^(\d{3})-`、`scaffold.mjs:115-116`）。test（`scaffold.test.ts:51-52`）は旧形 `001-...` を含むが max は新形 `015` のため旧形分岐を外しても `16` のまま緑。他の check（slice 2 の live `015`、slice 3 の live `015`）も新形が max で、旧形が max を決める木が無い
    - fixed: 旧形だけのケース（`["001-2026-09-20", "014-2026-10-09"]` → `15`）を足した

### Round 4

- Gaps:
  - `parseArgs` 多引数: I/O の parseArgs 行が単一 src 仮定で位置引数 2 個以上の扱いが未規定、Verify に `parseArgs(["a", "b"])` のケースが無い（テストは Round 3 で追加済み）
    - fixed: I/O の parseArgs 行に「位置引数 2 個以上は投げる」を足し、Verify に `parseArgs(["a", "b"])` → 投げるを足した（実装・テストは既存のまま）
  - tie-break 未規定・未検証: I/O の findPrevDefinition 行が NNN 降順のみで同 NNN の扱いが未規定。Verify の同 NNN ケースは両根 live 勝ちのみで同根の名前順が無い。コードの 3rd キーが名前降順で名前順と逆だった
    - fixed: I/O に「同 NNN は live 優先、同根・同 NNN は名前順」を足し、Verify に同 NNN 両根・同根名前順の2件を明記した。コードの 3rd キーを名前昇順に直し、同根・同 NNN で名前順に先の定義を返すテストを足した

## Acceptance

- Ran:
- Findings:
