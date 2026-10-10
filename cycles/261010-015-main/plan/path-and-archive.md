# PLAN `path-and-archive`

## Files

```text
.pi/skills/adr/
  SKILL.md                    update
  references/format.md        update
.pi/skills/design/
  SKILL.md                    update
  references/format.md        update
.pi/skills/plan/
  SKILL.md                    update
  references/format.md        update
  references/tasks.md         update
.pi/skills/work/
  SKILL.md                    update
  references/tasks.md         update
.pi/skills/close/
  SKILL.md                    update
.pi/extensions/consult/
  README.md                   update
  policy/types.ts             update
README.md                     update
README.ja.md                  update
cycles/
  archive/                    add（git mv の行き先）
  001-2026-09-20/             drop（git mv で archive へ。履歴は保つ）
  002-2026-09-22/             drop（同上）
  003-2026-09-24/             drop（同上）
  004-2026-09-25/             drop（同上）
  005-2026-09-25/             drop（同上）
  006-2026-09-27/             drop（同上）
  007-2026-09-27/             drop（同上）
  008-2026-09-28/             drop（同上）
  009-2026-09-28/             drop（同上）
  010-2026-09-29/             drop（同上）
  011-2026-10-04/             drop（同上）
  012-2026-10-05/             drop（同上）
  013-2026-10-09/             drop（同上）
  014-2026-10-09/             drop（同上）
```

## Slices

1. 表記の sweep
   - Verify:
     - cli: 下の14ファイルに `grep -rnE` を走らせる（ファイルはコマンドのオペランドに付ける。cwd 全体には走らせない。このサイクルの `adr.md` に旧表記の記録があるため）
       （`.pi/skills/design/SKILL.md`、`.pi/skills/design/references/format.md`、`.pi/skills/adr/SKILL.md`、`.pi/skills/adr/references/format.md`、`.pi/skills/close/SKILL.md`、`.pi/skills/plan/SKILL.md`、`.pi/skills/plan/references/format.md`、`.pi/skills/plan/references/tasks.md`、`.pi/skills/work/SKILL.md`、`.pi/skills/work/references/tasks.md`、`README.md`、`README.ja.md`、`.pi/extensions/consult/README.md`、`.pi/extensions/consult/policy/types.ts`）
       - `grep -rnE "NNN-YYYY-MM-DD|cycles/<NNN|[0-9]{3}-20[0-9]{2}-[0-9]{2}-[0-9]{2}"` → 0 件（旧 3 形: placeholder・短形・実在旧名）
       - `grep -rln "YYMMDD-NNN-<branch>"` → consult README を除く 13 件に入る（consult README は実例に置き換わるため literal を含まない）
       - `grep -n "261010-015-main/definition.md" .pi/extensions/consult/README.md` → 例の行
       - `test -f cycles/261010-015-main/definition.md` → exit 0（例の指す先が実在する）
       - `git status --porcelain -- .pi/skills/definition/` → 空（definition を触らない）
   - Steps:
     1. `design/references/format.md`: path 行を新形に
     2. `design/SKILL.md`: description と本文 2 か所を新形に。符号の付け方は変えない
     3. `adr/references/format.md`: path 行を新形に
     4. `adr/SKILL.md`: 本文 2 か所と手順6の `cycles/<NNN>/adr.md` を新形に
     5. `close/SKILL.md`: 本文と `collect.mjs` の引数の例を新形に
     6. `plan/references/format.md`: path 行を新形に
     7. `plan/references/tasks.md`: 読み先を新形に
     8. `plan/SKILL.md`: description と本文を新形に
     9. `work/references/tasks.md`: 読み先 3 か所を新形に
     10. `work/SKILL.md`: 読み先を新形に
     11. `README.md` / `README.ja.md`: `cycles/<NNN-DATE>/` を新形に
     12. `consult/README.md`: 例の `cycles/002-2026-09-22/definition.md` を新形の実在例（`cycles/261010-015-main/definition.md`）に
     13. `consult/policy/types.ts`: paths 説明の例 `cycles/<NNN>/plan/<plan id>.md` を新形に。符号の付け方は変えない
     14. `scaffold-script` plan と触るファイルが重ならないことを確かめる（`definition` スキルのファイルは触らない）
2. archive 移動
   - Verify:
     - cli: `ls cycles/`、`ls cycles/archive/`、`git status --porcelain`
       - `cycles/` 直下は `261010-015-main` だけ
       - `ls cycles/archive/` が `## Files` の 14 件と一致する（件数だけでなく名前）
       - rename が staged になる（`R` または `A` + `D` の組）
   - Steps:
     1. `cycles/`: `mkdir -p cycles/archive` の後、`## Files` に挙げた `cycles/` 下 14 件を `git mv cycles/<dir> cycles/archive/<dir>` で移す（履歴を保つためコピーではなく `git mv`）
3. 統合: 記録と表記が新 rule に揃う
   - Verify:
     - cli: slice 1 の直した確認を一通り（旧 3 形 0 件・新 literal 13 件 + 実例 1 件）と、worktree の根での `node scripts/product-ready/index.mjs`（`--root` なし。子のいる木が対象）
       - 旧 3 形が 0 件、新 literal が 13 件 + 実例 1 件
       - `cycles (2):` に live 1 件と `cycles/archive` 1 件が出る
   - Steps:
     1. 上のファイル: slice 1–2 の残りがあれば閉じる（残り物はないはず）

## Notes

### Slice 1: 表記の sweep

- Findings: なし
- Unplanned: なし
- Commit: cb2088851b7f8828838daca0ff8b50410079c7b2

### Slice 2: archive 移動

- Findings: なし
- Unplanned: なし
- Commit: 7b90523ed185361dcf549fef39bb02456889a6f6

### Slice 3: 統合: 記録と表記が新 rule に揃う

- Findings: なし
- Unplanned: なし
- Commit: なし（slice 1–2 に残りなしのため）

## Review

### Round 1

- Stale: なし（review の子は Shapes/Checks/Files で見て Stale の指摘なし。plan が触るのは表記と移動だけで、他を古くしない）
- Unlisted:
  - `consult/policy/types.ts:29` の paths 説明の例 `cycles/<NNN>/plan/<plan id>.md` が Files に無い（親が grep で見つけた）
    - fixed: Files と slice 1 の Steps に足し、design の Scope の consult 行にも足した
- Gaps:
  - slice 1 の grep が `<上の13ファイル>` の未展開 placeholder でそのまま実行できない
    - fixed: 14 ファイルを展開して書き、肯定側の `grep -rln` を足した
  - slice 1 の「新 pattern が全ての path 行に入る」に対応するコマンドが無く、旧 pattern 0 件だけでは新形の有無を分けられない
    - fixed: 同上（肯定側の `grep -rln` で 14 ファイル全てに入ることを見る）
  - slice 1 の「consult README が実在例を指す」に機械判定が無く目視になる
    - fixed: `test -f cycles/261010-015-main/definition.md` → exit 0 を足した
  - slice 1 step 14 の重なり確認（definition を触らない）に対応する Verify が無い
    - fixed: `git status --porcelain -- .pi/skills/definition/` → 空を足した
  - slice 2 の件数確認では 14 件の名前の正誤を分けられない
    - fixed: `ls cycles/archive/` が Steps の 14 件と一致することに変えた
  - slice 3 の `--root <worktree>` がどの木か未定義でそのまま実行できない
    - fixed: worktree の根で `--root` なしで走らせることに変えた

### Round 2

- Stale:
  - design の Scope と plan Files の不整合（types.ts が design に無い）
    - fixed: design の consult 行に `policy/types.ts` を足した
- Unlisted: なし（Round 1 の types.ts は Files・Steps・design に入った。新規の Unlisted なし。`collect.mjs` は引数で読むだけで旧 pattern を持たない）
- Gaps:
  - 肯定側 grep が自己矛盾（consult README は実例に置き換わるため literal を含まない。最大 13/14 になる）
    - fixed: 新 literal は consult README を除く 13 件、consult README は実例の grep に分けた
  - 旧 grep が placeholder 1 形だけで旧 3 形を覆わない（短形・実在旧名が false-pass する）
    - fixed: `grep -rnE` で旧 3 形を 1 本にし、14 ファイルをオペランドに付けた。cwd 全体には走らせない（adr.md に旧表記の記録があるため）
  - 肯定側と旧側の直しで slice 3 が偽陽性・偽陰性を継承する
    - fixed: slice 3 を直した slice 1 の確認（旧 3 形 0 件・新 literal 13 件 + 実例 1 件）に書き換えた
  - archive の突き合わせが Steps の間接参照のまま（Steps に名前が無い）
    - fixed: Steps と Verify の両方を `## Files` の 14 件に向けて直した

### Round 3

- Stale:
  - `.pi/skills/definition/SKILL.md:3` の `cycles/<NNN>/definition.md` と `:16` の `cycles/<NNN-YYYY-MM-DD>/definition.md` が旧形のまま新 rule と矛盾する（grep で確認）。この plan の `## Files` は definition を含まず、scaffold-script plan の Steps/Verify が名指すのは手順1の呼び出しと `format.md` の path 行だけなので、この2行はどちらの plan も名指さない
    - left: `scaffold-script` plan が吸収する（同じ SKILL.md を既に触っているため。`consult-10` が作業中）。この plan の guard（definition untouched）は保つ
- Unlisted: なし（`f0fb6fd..HEAD` の `.pi`/README 変更14件が `## Files` の14件と一致し、あとは `cycles/`→`cycles/archive/` の14件移動だけ。余分な変更なし）
- Gaps: なし（旧3形0件・新 literal 13件+実例1件・`test -f`・`git status -- .pi/skills/definition/`・`ls` 2件+rename・`product-ready` が各行為を直接見る。archive 内の旧表記と `adr.md` の旧記録は ADR が温存を決めており対象外が正しい）
- Unproven: なし（各 check は行為を戻せば赤になる。1件戻せば旧0件/新13件がずれ、例を戻せば実例 grep が外れ、移動を戻せば `ls` と `cycles (2):` がずれる）

## Acceptance

- Ran: slice 1–3 の確認を再実行（旧 3 形 0 件・新 literal 13 件 + 実例 1 件・`test -f`・definition untouched・`ls`・`cycles (2):`）。壊し 2 本（置換 1 件戻し・archive 1 件戻し）→ 赤 → 復旧 → 緑。全体 `pnpm typecheck` 緑・`pnpm test:run` 457 件緑
- Findings: なし
