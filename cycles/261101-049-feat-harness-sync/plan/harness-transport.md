# PLAN `harness-transport`

- No: 01, 02, 03

## Files

```text
package.json
vitest.config.ts                update
vitest.starter.config.ts
README.md                       update
README.ja.md                    update
test/
  scripts.fixture.ts            update
scripts/
  harness/
    index.mjs                   update
    index.test.ts               update
    list.mjs                    update
    list.test.ts                update
    config.test.ts              update
    harness.json                update
    starter.json                drop
  product-ready/
    targets.mjs
.pi/
  skills/
    plan/
      SKILL.md
      references/
        format.md               update
        tasks.md
    work/
      references/
        tasks.md
```

## Slices

## 1.一覧と運搬の書き換え

### Types

```ts
/** `scripts/harness/harness.json` の形 */
type HarnessList = {
  readonly starter: string;
  readonly copy: readonly string[];
  readonly push: readonly string[];
};

/** 一覧の項目を 1 つのルートで展開した結果。パスは `/` 区切りで、そのルートからの相対 */
type Resolved = {
  readonly paths: readonly string[];
  readonly missing: readonly string[];
};

/** 元から先へ写す物と、元で見つからなかった項目 */
type Diff = {
  readonly copy: readonly string[];
  readonly missing: readonly string[];
};

/** `--run` で写した物 */
type Applied = {
  readonly copied: readonly string[];
};

/** 相手の向きと、解決した絶対のパス */
type Starter = {
  readonly kind: 'self' | 'other';
  readonly path: string;
};

/** 相手のパスを、`~` と相対を開いて決める */
function resolveStarter(root: string, starter: string): Starter;
```

### Steps

1. `scripts/harness/list.mjs`:
   - `HarnessList` を `starter`、`copy`、`push` に変え、`readList` はその 3 キーだけを読み、`skip` と `legacy` を読まないようにする。
   - `copy` と `push` が無いときは空として扱い、配列でないときはファイルのパスを入れた 1 つのエラーを投げ、`starter` が文字列でないときも同じく 1 つのエラーを投げる。
   - `harnessExcludes` を、`copy` と `push` の両方の項目から `<項目>` と `<項目>/**` を作る形にする。
   - コメントの「道」を「パス」に直し、`置き場` は残す。
2. `vitest.config.ts`:
   - `testConfig(false)` が `harnessExcludes(readList(root))` を `exclude` に足す形は変えず、8 行目のコメントの「道」を「パス」に直す。
3. `scripts/harness/index.mjs`:
   - `readStarter` を、`readList` が返す `starter` を使う形にし、`scripts/harness/starter.json` を読まないようにする。`~` と相対を開いて `self` か `other` を返す (`Starter`)。
   - `starter` がない、一覧が JSON でない、指されたパスがない、の 3 種の場合は、今と同じ 1 行のエラーで止める。
   - 一覧の項目を `fs.globSync` で展開する収集に変え、一致が 0 件の項目を `missing` に集める。
     - Outside: `fs.globSync`。`cwd` に対象のルートを渡し、`exclude` で `**/node_modules/**` と `**/.git/**` を外し、`followSymlinks` は既定のままにする。返ったパスは `path.resolve` で絶対パスに直してから `/` 区切りの相対パスにし、辞書順にそろえる (並びは契約に無いため)。
   - 差分を「元にあって、先に無いか中身が違う物」だけにし、`remove`、`pruneEmptyDirs`、`collectLegacy`、`skip` を落とす。
   - 表示の見出しの次に `missing (<件数>):` のセクションを置き、1 件につき 1 行を出す。
   - `--run` では写すだけにし、`missing` があれば `--run` の有無にかかわらず終了コード 1 にする。
   - コメントの「道」を「パス」に直す。
4. `scripts/harness/harness.json`:
   - `starter`、`copy`、`push` の 3 キーにする。
   - `starter` は `~/Desktop/main/_pj-starter-pi-v3` にする。
   - `copy` は今の 16 件から `definition` を外し、`scripts/harness` の 1 件を `scripts/harness/*.mjs` と `scripts/harness/*.test.ts` に分けた 17 件にする。
   - `push` は `lib`、`scripts/checks`、`scripts/harness/*.mjs`、`scripts/harness/*.test.ts`、`test/temp-dir.ts`、`test/pi.fixture.ts`、`test/scripts.fixture.ts` にする。
5. `scripts/harness/starter.json`:
   - 消す。
6. `test/scripts.fixture.ts`:
   - `REMOVE` と `LEGACY` の定数を `MISSING` に置き換える。
   - コメントの「道」を「パス」に直す。
   - `COPY`、`SAME`、`countLine`、`sameLine`、`pullLine`、`pushLine`、`RUN_FLAG` は残す。
7. `scripts/harness/index.test.ts`:
   - `writeList` を `{ starter, copy, push }` を書く形にし、`writeStarter` を消す。
   - (happy) `copy` のパスが元にだけある → `copy (1):` とそのパスの行が出る
   - (empty) `copy` のパスが両側に無い → `no files to copy` の行が出る
   - (error) `copy` のパスが元に無い → `missing (1):` とそのパスの行が出て、終了コードが 1 になる
   - (error) 同じ一覧に `--run` を付ける → 写せるパスは写り、終了コードが 1 になる
   - (boundary) 読み取りの権限がないファイルを `copy` に書く → `missing` の行が出ない
   - (happy) `copy` に glob を書く → 一致したパスが `copy` に出る
   - (happy) `copy` に `scripts/harness/*.mjs` と `scripts/harness/*.test.ts` を書く → 一致したファイルの行が出て、`harness.json` と `starter.json` の行が出ない
   - (empty) `copy` に一致 0 件の glob を書く → `missing` の行が出る
   - (happy) 先にだけあるパスがある一覧に `--run` を付ける → そのパスは消えずに残る
   - (error) `copy` が配列でない、`push` が配列でない、`starter` が無い → それぞれ 1 行のエラーで終了コード 1 になる
   - (error) `harness.json` が JSON でない → 1 行のエラーで終了コード 1 になる
   - (error) `starter` の指すパスが無い → 1 行のエラーで終了コード 1 になる
   - (happy) `starter` が自分を指す → `same:` の 1 行だけが出る
   - (happy) `~` で始まる `starter` → HOME の下を相手として写す
   - コメントの「同じ道」を「同じやり方」に直し、テスト名の「道」を「パス」に直す。
8. `scripts/harness/list.test.ts`:
   - (happy) `{ starter, copy, push }` を置く → 同じ物が返り、`skip` と `legacy` は返らない
   - (empty) `copy` と `push` を書かない → 空として返る
   - (error) `starter` が無い → ファイルのパスを入れた 1 つのエラーで投げる
   - (error) `copy` が配列でない → 1 つのエラーで投げる
   - (happy) `harnessExcludes` に `copy` が 1 件、`push` が 1 件の一覧を渡す → 4 つの glob が、`copy` の 2 つ、`push` の 2 つの順に並ぶ
   - (happy) 末尾の `/` を落とし、空と `.` を飛ばす
   - テスト名の「道」を「パス」に直す。
9. `scripts/harness/config.test.ts`:
   - `testFiles` と、`test/` 直下の `*.ts` を `copy` に求めるテストを消す。
   - (happy) `testConfig(false)` → `copy` と `push` の両方の項目が `exclude` に入る
   - (happy) `testConfig(true)` → `exclude` が `undefined` になる
   - テスト名の「道」を「パス」に直す。

### Verify

- Always:
  - 関連テスト (`pnpm test:related scripts/harness/index.mjs scripts/harness/list.mjs vitest.config.ts test/scripts.fixture.ts`。関連がなければ `pnpm test:run`)
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - このスライスが変えた名前 (`copy`、`push`、`missing`、`starter`) と「道」を、大小文字を問わず `grep` する
- Added:
  - other — `mktemp -d` で作ったツリーに `scripts/harness/harness.json` (`starter` と、元に無いパスを 1 つ持つ `copy`) を置き、`node scripts/harness/index.mjs pull` を走らせて、`missing (1):` の行と終了コード 1 を確かめる

## 2.説明の書き換え

### Types

なし

### Steps

1. `README.md`:
   - ハーネスのセクションを、`harness.json` の `starter`、`copy`、`push` の 3 キーと、消さないことと、glob と、`missing` と終了コード 1 を書く形に直し、`starter.json` と `legacy` の記述を消す。
2. `README.ja.md`:
   - 同じ内容を日本語で書く。
3. `.pi/skills/plan/references/format.md`:
   - 106 行目を、`test/` の備品が `copy` に載ることを、2 つの一覧のどちらかが分かる形で書く。

### Verify

- Always:
  - 関連テスト (`pnpm test:related` に当たるテストが無いので `pnpm test:run`)
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - このスライスが変えた記述 (`copy`、`push`、`missing`、`starter`、`legacy`) を、大小文字を問わず `grep` する
- Added:
  - a proofread — この plan md と `.pi/skills/plan/references/format.md` を、`.pi/skills/plan/SKILL.md` の校正の文で回す

## Notes

### Slice 1: 一覧と運搬の書き換え

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: 説明の書き換え

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Work Review

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
