# DESIGN 047

## Affected

### 01: close の手順等の全面改訂

- なし

### 02: plan の作成手順改訂

- `.pi/skills/plan/references/tasks.md` — `format.md` の形状と `## Test cases` を読む
- `.pi/skills/work/references/tasks.md` — `format.md` の `## Test cases` でケースを読み、`## Review` に書く
- `scripts/harness/harness.json` — `.pi` をコピー対象に指定する
- `lefthook.yaml` — `md`・`mjs`・`ts` を pre-commit と pre-push で整形・lint・型検査・テストする
- `.oxlintrc.json` — `.pi/**/*` を含む `mjs`・`ts` を lint 対象にする
- `.oxfmtrc.json` — 整形の設定を持つ
- `package.json` — `format`・`lint`・`typecheck`・`test` の入口を持つ
- `scripts/checks/scopes.json` — `.pi` を型検査の対象にする
- `.pi/tsconfig.json` — `.pi` 配下の `ts` を型検査の対象にする
- `scripts/checks/typecheck.mjs` — `scopes.json` を読んで型検査を実行する
- `scripts/checks/typecheck-staged.mjs` — staged の `mjs`・`ts` を型検査する

## External

### 01: close の手順等の全面改訂

- なし

### 02: plan の作成手順改訂

- なし

## `procedure-rewrite`

### ADR & Where

- No: 01, 02
- Why: 2 つのエントリが `close/SKILL.md` と `close/references/format.md` を共通して書き換えるため、1 つの worktree で続けて行い、待つものはない。
- Where: worktree

### Goal

- `close/SKILL.md`、`yolo/SKILL.md`、`close/references/format.md` を読むと、roadmap No.008 の 5 点 (コレクトから校正までのエージェント実行、解決済みの除外、判断軸、`Fact` / `Why` / `Then`、提案の完成) が手順として揃っている。
- `close/SKILL.md` の手順を読むと、「コレクト → 解決済みの除外 → トリアージ提案 → close.md の完成 → 校正 → owner の判断 → `ex-` の実行とマージ → verify」の順に並んでいる。
- `close/SKILL.md` を読むと、close.md が完成した時点で `## Verified` が空であることが正常な状態だと書かれている。
- `close/SKILL.md` を読むと、トリアージ提案を close.md に書き、校正の終了後に owner が読んで判断すると書かれている。
- `close/SKILL.md` を読むと、owner の判断の後に `ex-` の plan を実行してマージし、`## Triage` の各行が `done <commit>` になるまで進めると書かれている。
- `close/SKILL.md` を読むと、`ex-` が残らなくなった時点で Unit ごとに verify して `## Verified` を書くと書かれている。
- `close/SKILL.md` を読むと、verify で動かない Unit があれば `ex-` plan を作り、マージした後にその Unit を verify し直すと書かれている。
- `close/SKILL.md` を読むと、判断軸が「現サイクルの関心ごと → `ex-`、明らかなバグや脆弱性や古い実装 → `ex-`、大きい、または調査が要る → `proposed`、それ以外 → `drop`」の順に書かれている。
- `close/SKILL.md`、`close/references/format.md`、`yolo/SKILL.md` のどこにも、`DEFINITION.md` を動かすか否かを第一分岐にする記述が残っていない。
- `close/references/format.md` の `## Collected` を読むと、`<line> / <place> / <穴>` の目録だけが書かれ、`Doing` / `Left` / `Cost` が無い。
- `close/references/format.md` の `## Triage` を読むと、各バレットの配下に `Fact` / `Why` / `Then` が構造として並んでいる。
- `close/SKILL.md` を読むと、解決済みの残り物はエージェントが文面から判断して除外し、collect.mjs の再実行のたびに再フィルタすると書かれている。
- `close/SKILL.md` と `close/references/format.md` を読むと、verify の対象が `Users can do` に列挙された Unit に限られると書かれている。
- `close/SKILL.md` と `close/references/format.md` を読むと、`Product` / `What` / `Who` / `Stack` を検証対象にしないと書かれている。
- `yolo/SKILL.md` の close セクションを読むと、close.md の完成までを担って owner の判断の前で止まると書かれている。
- `yolo/SKILL.md` の close セクションを読むと、校正が owner の判断の前に終わると書かれている。
- `yolo/SKILL.md` の close セクションに、`drop` のときだけ止まる規則が無い。
- `yolo/SKILL.md` の close セクションを読むと、yolo は `## Verified` を書かないと書かれている。
- `yolo/SKILL.md` の close セクションを読むと、close.md の完成から verify までの順序が close と同一だと書かれている。
- `.pi/skills/close/scripts/collect.mjs` の diff を読むと、`isLeftover` と `isNone` が変わっていない。
- `close.md` の形 (`.pi/skills/close/references/format.md`) を読むと、目録の `## Collected`、`Fact` / `Why` / `Then` を持つ `## Triage`、Unit ごとの `## Verified` で書かれている。
- `close/SKILL.md` と `yolo/SKILL.md` の本文を読むと、旧手順 (Collected を見せて owner と共にトリアージする、yolo が `drop` で止まる) の記述が残っていない。
- `plan/SKILL.md` を読むと、roadmap No.009 の 2 点 (1 ファイルずつレビューに出し、レビュー中に次を作り、全レビューの後に並列で校正する) が手順として揃っている。
- `plan/SKILL.md` を読むと、1 ファイルの作成とレビューの送信が重なり、レビュー中に次のファイルを作ると書かれている。
- `plan/SKILL.md` を読むと、重複検出の step が全 plan の完成後に実行されると書かれている。
- `.pi/skills/plan/references/format.md`、`.pi/skills/work/SKILL.md`、`.pi/skills/work/references/tasks.md`、`.pi/skills/close/SKILL.md`、`.pi/skills/close/references/format.md`、`.pi/skills/close/scripts/collect.mjs` を読むと、plan md のセクション名が `## Work Review` で揃い、`collect.mjs` は `section.name === 'Work Review'` と `Work Review Round N` を読み、`.pi/skills/close/scripts/collect.test.ts` を走らせると `## Work Review` の指摘が残り物として集まる。
- `plan/SKILL.md` を読むと、校正の step が全レビューの終了後に全ファイルを並列で proofreader に渡すと書かれている。
- `.pi/skills/plan/references/format.md` の形を読むと、plan md のセクションが `## Files`、`## Slices`、`## Notes`、`## Work Review`、`## Acceptance` のままで、増えていない。
- `plan/SKILL.md` の本文を読むと、旧手順 (全 plan を書き終えてからレビューする) の記述が残っていない。

### Non-goal

- close.md の番号行と `## Triage` の行の形は変えない (理由: collect.mjs がこの形を読む)。
- collect.mjs に解決済み除外の判定を入れない (理由: 判断はエージェントの文面判断で行う)。
- plan md にセクションを増やさない (理由: plan 段階のレビューは記録のためのセクションを持たない)。
- 閉じたサイクルの plan md を書き換えない (理由: 以後読まれない; このサイクルの plan md は plan 段階が `## Work Review` で書く)。
- `DEFINITION.md` を動かすか否かのゲートに戻さない (理由: 採らなかった Option B)。
- owner と共にトリアージを進める形に戻さない (理由: 採らなかった Option C)。
- 重複検出をレビューの前に置かない (理由: 採らなかった Option B)。
- ideas を注記として足すだけにしない (理由: 採らなかった Option C)。

### Summary

- close の手順を、エージェントが close.md を完成させて owner が判断する形に書き換え、目録とトリアージの分担を変える。
- plan の手順を、1 ファイルずつレビューに出す形に書き換え、work 段階のレビューを `## Work Review` に改名する。

### Paths

- `.pi/skills/close/SKILL.md`
- `.pi/skills/close/references/format.md`
- `.pi/skills/yolo/SKILL.md`
- `.pi/skills/plan/SKILL.md`
- `.pi/skills/plan/references/format.md`
- `.pi/skills/work/SKILL.md`
- `.pi/skills/work/references/tasks.md`
- `.pi/skills/close/scripts/collect.mjs`
- `.pi/skills/close/scripts/collect.test.ts`
- `.pi/skills/close/scripts/collect.fixture.ts`

### Boundary

- Plans: なし
- External: なし
