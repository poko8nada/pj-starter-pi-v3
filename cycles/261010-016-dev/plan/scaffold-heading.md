# PLAN `scaffold-heading`

## Files

```text
.pi/skills/definition/
  scripts/
    scaffold.mjs              update
    scaffold.test.ts          update
  SKILL.md                    update
lib/
  git-env.mjs
```

`lib/git-env.mjs` は `scaffold.mjs` が import するだけ（中身は変えない）。

## Slices

1. 見出しを書く純関数
   - I/O:
     ```js
     export function withHeading(body: string, nnn: number): string
     ```
   - Verify:
     - test: `pnpm vitest run .pi/skills/definition/scripts/scaffold.test.ts`。`scaffold.test.ts:75-102` の流儀に合わせて書く
       - (happy) `withHeading('# Definition 015\n\n本文\n', 16)` → `'# Definition 016\n\n本文\n'`
       - (happy) `withHeading('# Definition <NNN>\n\n本文\n', 1)` → `'# Definition 001\n\n本文\n'`
       - (boundary) `withHeading('## Product\n', 16)` → `'# Definition 016\n## Product\n'`（見出しが無ければ置くだけ）
       - (boundary) `withHeading('前置き\n# Definition 015\n', 16)` → `'# Definition 016\n前置き\n'`（先頭行でなくても落ちる）
       - (boundary) `withHeading('# Definition 015\n# Definition 014\n', 16)` → `'# Definition 016\n# Definition 014\n'`（落とすのは最初の 1 行だけ）
       - (boundary) `withHeading('# Definition 015\r\n\r\n本文\r\n', 16)` → `'# Definition 016\n\r\n本文\r\n'`
       - (boundary) 同じ番号で 2 回呼ぶ → 2 回目が 1 回目と同じ文字列になる（冪等）
       - `nnn` が数でない時の扱いは、番号を決める `parseArgs` の担当なのでケースにしない（slice 2）
   - Steps:
     1. `scaffold.mjs`: `withHeading` を足す。落とすのは `^# Definition \S+\r?$` に合う最初の行、置くのは先頭の `# Definition <nnn>`（3 桁 0 埋め）。改行は正規化しない
     2. `scaffold.test.ts`: 上のケースを書く。import に `withHeading` を足す

2. CLI が番号を 1 回だけ決める
   - I/O:
     ```js
     export function parseArgs(argv: readonly string[]): { root: string, nnn: number | null }
     ```
     ```text
     引数 → 作られる物
       nnn = args.nnn ?? nextNNN(両根の名前)    1 回だけ決める
       dirName = cycleDirName(nnn, toYYMMDD(new Date()), slug)
       definition.md の中身 = withHeading(stripMarkers(前の definition か TEMPLATE_001), nnn)
       印字: `created: <leaf>` と `src: <前の definition の道 か template>`
       同じ名前のフォルダがあれば `exists: <path>` を出して exit 1
     ```
   - Verify:
     - test: `pnpm vitest run .pi/skills/definition/scripts/scaffold.test.ts`
       - (happy) `parseArgs(['016'])` → `nnn` が `16`（位置引数はファイルの道ではなく番号）
       - (happy) `parseArgs([])` → `root` が `process.cwd()`、`nnn` が `null`
       - (happy) `parseArgs(['--root', '/tmp/x'])` → `root` が `'/tmp/x'`、`nnn` が `null`
       - (error) `parseArgs(['abc'])` が投げる（文面はケースにしない）
       - (error) `parseArgs(['1.5'])` が投げる
       - (error) `parseArgs(['0'])` が投げる（番号は 1 以上）
       - `parseArgs(['-1'])` はケースにしない。`-` で始まる物は新旧どちらも未知引数として投げるので、数値の検査の有無を見分けない
       - (error) `parseArgs(['--bogus'])` が投げる。`parseArgs(['--root=/tmp/x'])` も投げる（`=` の形は扱わない）
       - (error) `parseArgs(['--root'])` が投げる（値が無い）
       - (error) `parseArgs(['016', '017'])` が投げる（位置引数は 1 つ）
     - cli: 木を 1 つ作って走らせ、番号と見出しを見る
       ```sh
       S="$(git rev-parse --show-toplevel)/.pi/skills/definition/scripts/scaffold.mjs"
       T=$(mktemp -d)
       D=$(date +%y%m%d)
       mkdir -p "$T/cycles/261010-015-main"
       printf '# Definition 015\n\n## Product\n\nx\n' > "$T/cycles/261010-015-main/definition.md"
       git -C "$T" init --quiet
       git -C "$T" config user.email a@b
       git -C "$T" config user.name a
       git -C "$T" add -A
       git -C "$T" commit --quiet -m base
       git -C "$T" checkout --quiet -b feature/x
       node "$S" --root "$T" 016
       ```
       - (happy) 出力の 1 行目が `created: $T/cycles/$D-016-feat-x`、2 行目が `src: $T/cycles/261010-015-main/definition.md`（`src:` は草案の出どころ。日付は今日なので `$D` で組む）
       - (happy) `head -1 "$T/cycles/$D-016-feat-x/definition.md"` が `# Definition 016`（明示した番号がフォルダ名と見出しの両方に入る）
       - (error) 同じ木で同じ番号をもう一度走らせると、`exists: ` を出して終了コード 1
   - Steps:
     1. `scaffold.mjs`: `parseArgs` を `{ root, nnn }` に変える。位置引数は `/^\d+$/` に合う物を数にし、0 は投げる（`src` を落とす）
     2. `scaffold.mjs`: CLI 本体で `nnn = args.nnn ?? nextNNN(names)` を 1 回だけ決め、`cycleDirName(nnn, yymmdd, slug)` と `withHeading(draft, nnn)` の両方に使う。`src` を読む分岐を消し、`isAbsolute` の import を消す。冒頭の注記を `node scaffold.mjs [--root <dir>] [<nnn>]` に直し、「見出し番号は書き手が直す」を消す
     3. `scaffold.test.ts`: `parseArgs` の既存の `src` のケースを `nnn` のケースに置き換える
        - Outside: design の `node`。`.mjs` のままにする（型注釈や変換を持ち込まない）

3. 統合: 素起こしが番号まで書く
   - I/O:
     ```text
     SKILL.md の手順 1:
       引数なしの呼び出しを残す（番号は走査で決まる）。印字された path を使う
       「見出しを手で付ける」指示を消す
       番号を明示する時は数字を渡せることを書く
     ```
   - Verify:
     - cli: 文書の 3 つの数
       - (happy) `grep -c "with no arguments" .pi/skills/definition/SKILL.md` → `1`
       - (empty) `grep -c "set the" .pi/skills/definition/SKILL.md` → `0`
       - (happy) `grep -c "\[<nnn>\]" .pi/skills/definition/SKILL.md` → `1`
     - cli: ケースごとに新しい木を作って走らせる（`$T` を使い回さない）
       ```sh
       S="$(git rev-parse --show-toplevel)/.pi/skills/definition/scripts/scaffold.mjs"
       mk() {   # $1 = 木, $2 = 前の definition の中身（printf の書式）
         mkdir -p "$1/cycles/261010-015-main"
         printf '%b' "$2" > "$1/cycles/261010-015-main/definition.md"
         git -C "$1" init --quiet
         git -C "$1" config user.email a@b
         git -C "$1" config user.name a
         git -C "$1" add -A
         git -C "$1" commit --quiet -m base
         git -C "$1" checkout --quiet -b feature/x
       }
       BODY='# Definition 015\n\n## Product\n\nx\n'
       D=$(date +%y%m%d)   # フォルダ名の日付は今日なので、決め打ちしない
       ```
       - (happy) `T=$(mktemp -d); mk "$T" "$BODY"; node "$S" --root "$T"` → `ls -1 "$T/cycles"` に `$D-016-feat-x` があり、見出しが `# Definition 016`
       - (happy) 明示 001: `T=$(mktemp -d); mk "$T" "$BODY"; node "$S" --root "$T" 001` → `$D-001-feat-x` があり、見出しが `# Definition 001`
       - (error) `T=$(mktemp -d); mk "$T" "$BODY"; before=$(ls -1 "$T/cycles" | wc -l); node "$S" --root "$T" abc; echo $?` → 終了コードが 0 でなく、`ls -1 "$T/cycles" | wc -l` が `$before` と同じ（フォルダが増えない）
       - (boundary) 空の木: `T=$(mktemp -d); git -C "$T" init --quiet; git -C "$T" config user.email a@b; git -C "$T" config user.name a; git -C "$T" checkout --quiet -b feature/x; node "$S" --root "$T"` → `$D-001-feat-x` があり、見出しが `# Definition 001`、`src:` が `template`（前の definition が無いので Template になる。番号は `nextNNN` の 1）
       - (boundary) 見出しが無い definition: `T=$(mktemp -d); mk "$T" '## Product\n\nx\n'` の木で `node "$S" --root "$T"` → 終了コード 0、見出しが `# Definition 016`
       - (boundary) `--root` を省く: `T=$(mktemp -d); mk "$T" "$BODY"; (cd "$T" && node "$S")` → `$T/cycles/$D-016-feat-x` ができる
       - (happy) `pnpm vitest run .pi/skills/definition/scripts/scaffold.test.ts` が緑、`pnpm lint` が緑
       - (error) 壊し: `writeFileSync` に渡す `draft` から `withHeading` を外す → 明示 001 と自動採番の見出しのケースが赤に戻る（確かめたら戻す）
   - Steps:
     1. `SKILL.md`: 手順 1 の行を、番号まで scaffold が書く形に直す
     2. `scaffold.mjs`: slice 1–2 の残りを閉じる（残り物はないはず）

## Notes

### Slice 1: 見出しを書く純関数

- Findings:
- Unplanned:
- Commit:

### Slice 2: CLI が番号を 1 回だけ決める

- Findings:
- Unplanned:
- Commit:

### Slice 3: 統合: 素起こしが番号まで書く

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Unproven:

## Acceptance

- Ran:
- Findings:
