# PLAN `flow-skill`

- No: 02
- Place: worktree
- Boundary Plans: なし（`procedure-skills`、`judgment-skill` と並行して走る）

## Design

- Inside:
  - Modules: なし。`SKILL.md` は 1 ファイルで完結しており、統合も分割もしない。全体は、導入文、`## When it runs`、`## Procedure`（三つのステージ）、`## When a step cannot run`、`## When it stops early`、`## How not to write this` の六つの部分に作り直す。条件は二つの表に集め、手順は三つのステージに分ける。
  - Dirs: なし。`.pi/skills/yolo/` の位置は動かさない。
- Outside:
  - Extract: なし。条件の表と置き換えの規則は、このスキルだけが持つ。共通化するモジュールはない。
  - Colocate: なし。共通化をやめるモジュールはない。

## Files

```text
.pi/
  skills/
    plan/
      SKILL.md
    work/
      SKILL.md
    close/
      SKILL.md
    yolo/
      SKILL.md    update
```

## Slices

## 1.流れスキルの形を揃える

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/yolo/SKILL.md`:
   - update: 冒頭文は変えず、`## When it runs` を下のフェンスの `View:` と `Note:` にし、`## The flow` を `## Procedure` に改めて `### 1. plan`、`### 2. work`、`### 3. close` の三つのステージを `Steps:` と `Notes:` に分け（残りの箇条書きはすべて `Steps:` にし、`skips:` は `Notes:` の行にし、`go on to` は最後のステップに置き）、`## The flow` の直下の導入文と `## The flow` の後の段落を `## Procedure` の `Note:` にし、`## When a step cannot run` を新設し、`## When it stops early` の直下の導入文を `Note:` にして三つの条件を表にして四つ目の条件を足し、`## What it does not do` を `## How not to write this` に改める。frontmatter（`name`、`description`、`disable-model-invocation`）と、他のスキルの手順を名指しする文（`plan` の 7 つの観点、`work` の手順、`close` の手順）は変えない。文は `adr` の文体に揃え、1 文に 1 つの事実を置き、行動の主語を明示し、現在形で書き、列挙は表にする。内容を落とさない。意味を変えずに短くできる重複した文は短くする。
     ```md
     ## When it runs

     View:

     | case                                                          | does it run                                                     |
     | ------------------------------------------------------------- | --------------------------------------------------------------- |
     | the owner starts it, after every entry of the ADR is accepted | it runs                                                         |
     | started before that                                           | it does not run: nothing runs, and it says so                   |
     | a stage the cycle has passed                                  | that stage is not walked again                                  |
     | the ADR                                                       | not this skill's business: no entry is accepted or checked here |

     Note: when the cycle stands inside a close's `ex-` plan, the run walks that plan to its merge, then runs the close's collect and the proposal again, and stops before the owner's judgement on the new triage.
     ```
     ```md
     ## When a step cannot run

     Steps:

     1. Replace the step or the check with a check the agent can run.
     2. Write the replacement in the plan md.

     View:

     | cannot run as written                | what replaces it                   |
     | ------------------------------------ | ---------------------------------- |
     | a `base` plan's owner look           | a check the agent runs in the base |
     | a step that closes by the owner's OK | a check the agent runs             |

     Note: the stage and the stop point do not move.
     ```
     ```md
     ## When it stops early

     View:

     | case                                                                         | what to do                                |
     | ---------------------------------------------------------------------------- | ----------------------------------------- |
     | a plan's premise turns out false, and what closes it sits outside the plan   | stop, and ask the owner                   |
     | a merge leaves the base red, and the plan's fix does not bring it back green | stop, and ask the owner                   |
     | a pair of plans would make the same thing                                    | stop, and ask the owner to decide the cut |
     | no check the agent can run replaces the step                                 | stop, and ask the owner                   |

     Note: a hole the run finds and fixes in the plan's own files is not one of these: the slice's `Unplanned` holds it, and the run goes on.
     ```
     ```md
     ## How not to write this

     - Do not decide a change the ADR did not accept
     - Do not call the other skills: each stage keeps its own rules, and the flow above is the order it walks them
     - Do not change a stage or the stop point
     ```

### Verify

- Always:
  - `pnpm test:related .pi/skills/yolo/SKILL.md`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた `.pi/skills/yolo/SKILL.md` 全体と、それが名指す `.pi/skills/plan/SKILL.md`、`.pi/skills/work/SKILL.md`、`.pi/skills/close/SKILL.md` を読み、読む順に手順をたどり、番号、パス、名前、形を当て、名指しが相手のファイルで解決することを確かめ、不整合を直す。
- Added:
  - other: `## When it stops early` の表の行が四つ、`## When a step cannot run` の表の行が二つであることを `git diff` で確かめる。

## Notes

### Slice 1: 流れスキルの形を揃える

- Findings: なし
- Unplanned: なし
- Commit: 60a8bff9392976555550daf7f5a20c770b03755c
- Stopped:

### Cleanup: テスト掃除

- Findings: なし — 計画の Files は文書のみで、テストファイルを含まない
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - なし — yolo の 7 観点・work 手順・close 手順の名指しは相手の現状と一致し、旧見出しへの残存参照もない (`.pi/skills/yolo/SKILL.md:34`、`.pi/skills/plan/SKILL.md:66-78`、`.pi/skills/work/SKILL.md:34-55`、`.pi/skills/close/SKILL.md:41-100`)。
- Unlisted:
  - なし — 差分の変更は Files が update とする yolo のみで、plan・work・close は関連参照のままである (`.pi/skills/yolo/SKILL.md:11-103`、`cycles/261107-057-dev/plan/02-flow-skill.md:16-29`)。
- Gaps:
  - なし — 表の行数は Added の目視対象で、frontmatter・冒頭文・名指しの不整合は Always の読み通しが担い、該当しない proofread・DB 等はない (`cycles/261107-057-dev/plan/02-flow-skill.md:98-107`)。
- Unproven:
  - なし — 計画にテストファイルがなく、Added は目視の行数確認なので、壊しても緑のままのテストはない (`cycles/261107-057-dev/plan/02-flow-skill.md:35-39`)。
- Noise:
  - なし — テスト手順がなく、Added の 4 行・2 行は ADR と plan のフェンスが決めた値で、型や制約が済ませる重複確認でもない (`cycles/261107-057-dev/plan/02-flow-skill.md:107`、`cycles/261107-057-dev/adr.md:192-213`)。
- Doubts:
  - なし

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran: ワークツリーで `pnpm test:run`（63 ファイル、782 試験が合格）、`pnpm typecheck`（root と `.pi` が ok）、`pnpm lint`、`pnpm format:check` を走らせた。変えた `yolo/SKILL.md` を読み、`Steps:`・`View:`・`Notes:` の分け方、`## When it runs` の表、`## When a step cannot run` の表、停止の表、末尾の 3 項目、冒頭文、frontmatter、名指しの解決を確かめた。`git diff` で、停止の表が 4 行、置き換えの表が 2 行であることを確かめた。
- Findings: なし
- Doubts: オーナーが受入の前に確認した。直す点の指摘はなかった。
