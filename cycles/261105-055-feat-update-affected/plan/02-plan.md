# PLAN `02-plan`

- No: 03, 05
- Place: base
- Boundary Plans: なし

## Design

- Inside:
  - Modules: なし。4つのファイル（`SKILL.md`、`cut.md`、`format.md`、`tasks.md`）は、手順、切り方、書式、手渡し文で、役割が違う。統合も分割もしない。
  - Dirs: なし。`references/` の構成は変えない。
- Outside:
  - Extract: なし。`plan` と `adr` の共通化は、スキルをまたぐので扱わない。4つのファイルに共通する部分もない。
  - Colocate: なし。

## Files

```text
.pi/skills/plan/
  SKILL.md                 update
  references/
    cut.md                 update
    format.md              update
    tasks.md               update
```

## Slices

## 1.読み方とステップ

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/references/format.md`:
   - update: `## Design` を `## Files` の前に足す。
     ```md
     ## Design

     - Inside:
       - Modules: <統合・分割するファイルやモジュール。答えと、なぜその形なのか。なければ なし>
       - Dirs: <統合・分割・移動するディレクトリ。答えと、なぜその形なのか。なければ なし>
     - Outside:
       - Extract: <共通化するモジュール。答えと、なぜその形なのか。なければ なし>
       - Colocate: <共通化をやめ、コロケーションするモジュール。答えと、なぜその形なのか。なければ なし>
     ```
   - update: `### Steps` の単位・行・フェンスを、ファイル、モジュール（`<path>#<module>`）、ディレクトリ（空の dir と、残す dir の2つの場合だけ）にし、1行を `何がどうなるか` にする。フェンスは、ADR かチャットが中身を具体的に決めたときだけ、ステップの子に置く。テストのステップはケースの行を残し、決まった中身があればケースの行の下にフェンスを置く。`Outside:` は1行の後、フェンスの前、順序と番号は作業の順のままとする。テストのステップは `(happy|error|empty|boundary) <given> → <result>` のままとする。
     ````md
     ### Steps

     1. `<ファイル>`:
        - update: <何がどうなるか。1文>
          - Outside: `<affected.md の ### External の項目>`。<そこで何をするか>

          ```ts
          <ADR かチャットが決めた中身。決まっていないときは置かない>
          ```

     2. `<path>#<module>`:
        - update: <何がどうなるか。1文>

     3. `<dir>/`:
        - add: <空の dir を作る、または、最後のファイルを消して dir を残す>
     ````
   - update: `## Shape` の `### Steps` の例を、上の形にする。
   - update: `## Verify` の `Always` の5行目と6行目を、下の1行に変える（5行目は消える）。
     ```md
     - the read-through: read every changed file whole, and every file it names whole; follow the procedure in the order the file gives, as the one who acts on it; check the number, the path, the name and the shape at each place against what it points to; fix any inconsistency, and write the fix in `Unplanned`
     ```
   - update: `## Files` の「affected の `Code` のパスと `Direction` が `Files` の行である」を、「plan が affected のパスを読み、自分で印を決める」に変える。ツリーのディレクトリの行に、空の dir と残す dir の印（`add` / `drop`）を付けられるようにする。
   - update: `Scope` を越えた step を書かない規則（173 行目）を、問い 3 と 4 の対象は越えても書く形に変える。
2. `.pi/skills/plan/SKILL.md`:
   - update: 手順 2 の地図の説明を、`Kind` と `Edge` に変え、「関係をたどらない」を消す。
   - update: 手順 3 の `Why` を、`Kind` と `Edge` から書く形に変える。
   - update: 手順 4 を、地図の全パスと、それらの周辺にある関連ファイルを読む手順にし、4つの問いと `## Design` を書く手順を足し、`Files` を plan が読んで決める形にし、ステップの単位・行・フェンスを書き、`SKILL.md:40` の対応表を、`Edge: checks` は `Verify`、`Kind: artifact` は成果物、`### External` は `Outside:`、地図のパスは `Files` に変える。答えられないときは `hole` として止め、中身が決まっていない行は `research` と `Stopped` に回す。
     ```md
     After reading the files, ask these four questions, and write the answers to `## Design`.

     1. Within the plan's scope, is there a file or a module inside a file (code or doc) to merge or split?
     2. Within the plan's scope, is there a directory to merge, split or move?
     3. Outside the plan's scope, does this plan's work create a module (code or doc) that should be shared?
     4. Outside the plan's scope, does this plan's work make a module that should no longer be shared and should sit beside its user?

     A target of question 3 or 4 goes into `Files` even when it is past the ADR's `Scope`; the reason goes into `## Design`.
     ```
   - update: 手順 2 から 4 の並びを、地図 → ファイル → 4つの問い → `## Design` → `Files` → `Steps` → `Verify` の順に組み直す。
3. `.pi/skills/plan/references/cut.md`:
   - update: `Why` の「`Role change` と `Adjustment` を読む」を、「`Kind` と `Edge` を読む」に変える。
4. `.pi/skills/plan/references/tasks.md`:
   - update: review の `Goal` を、`## Design` の答えと `Scope` を読む形に変える。

### Verify

- Always:
  - `pnpm test:related .pi/skills/plan`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `Role change`、`Adjustment`、`Direction`、`Relation`、`Role`、`does not walk the relations again`、`Code paths and directions`、`Check`、`Generate`、`One step is one file` を、大小文字を問わず検索する
  - 変えた4つのファイル全体と、そのファイルが名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added:
  - a `base` plan's look — オーナーがスライスの変更を読み、OK がスライスを閉じる
  - a proofread — plan md（`cycles/261105-055-feat-update-affected/plan/02-plan.md`）と `.pi/skills/plan/references/format.md` を、スキルの proofread 文で

## Notes

### Slice 1: 読み方とステップ

- Findings: なし
- Unplanned:
  - `format.md` の `## Slices` の「the `Why`」が、plan md にない欄を指していた。通読で見つけ、「the `Design`」に直した
  - `plan/02-plan.md` の `Steps` の「156 行目」が、`df9379a` の変更で 173 行目に動いていた。通読で見つけ、直した
  - `SKILL.md` の手順7（proofread）が、`format.md` の `## Verify` の通読の新しい形（ファイル全体と名指すファイル）を読んでいなかった。通読で見つけ、手順7に1文を足した
- Commit: `df9379a`
- Stopped: なし

## Work Review

### Round 1

- Stale: なし — 旧語彙（`Role change`・`Adjustment`・`Direction`・`Relation`・`does not walk the relations again`・`Code paths and directions`・`One step is one file`・`Generate`）は `.pi/skills/plan/` に残っていないことを grep で確かめた。残る `Why`（`SKILL.md:28`・`cut.md:25`）・`Scope`・`Checks`・`typecheck` は現行の欄名・観点名・コマンド名で、変更が冗長にした文ではない。
- Unlisted: なし — `git diff 52fc5cb..HEAD` で `.pi/skills/plan/` 配下の変更は `Files` の4件（`SKILL.md`・`cut.md`・`format.md`・`tasks.md`）だけである。他の変更（`.pi/skills/adr/` 配下など）は 01-adr の所管で、この plan の `Scope`（03・05）外である。
- Gaps: なし — スライスの `Verify`（通読・grep・`test:related`／`typecheck`／`lint`／`format:check`・`base` の look・proofread）は、03 の全パス読み・4つの問い・`## Design`・`Files` の印・問い 3・4 の `Scope` 越えと、05 の単位・行・フェンス・`Outside:` 位置・順序をいずれも辿って確かめられる。テストファイルを持たないため `## Test cases` で読むべきケースはなく、フェンスの中身は ADR・チャットが決めた値なので gap ではない。
- Unproven: なし — このスライスはテストを追加・変更しておらず、振る舞いを外しても緑のまま残るテストはない。
- Noise: なし — 同上、追加されたテストがないため、型・スキーマ・DB が保証する前提や誰も気づかないケース、マジックナンバー・ハードコード文字列の持ち込みはない。
- Doubts: なし

## Acceptance

- Ran:
  - `pnpm typecheck` — ok。
  - `pnpm test:run` — 63ファイル、757件 pass。
  - 各スライスの `Verify` の `Always`。
  - `Added`: a `base` plan's look — オーナーの look（`Doubts` に下記）。
- Findings: なし
- Doubts:
  - slice 1 は、オーナーの OK の前にコミットした（`df9379a`）。
