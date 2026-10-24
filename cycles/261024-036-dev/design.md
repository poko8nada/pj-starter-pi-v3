# DESIGN 036

## Affected

### 02: base / worktree と dropped / ex- の分岐を Place と PlanState にまとめるか

- なし

### 03: yolo が work 中に owner のブラウザ確認をパスし、base plan を使わないと書くか

- なし

## External

### 02: base / worktree と dropped / ex- の分岐を Place と PlanState にまとめるか

- なし

### 03: yolo が work 中に owner のブラウザ確認をパスし、base plan を使わないと書くか

- なし

## `close-records`

### ADR & Where

- No: 02
- Why: `close` の記録の出所（`close` / `plan` / `collect.mjs`）が 1 つの入力で、`ex-` の `No` と開始条件を一緒に読む。待つ plan は無い。
- Where: worktree — `collect.mjs` のコードと review がある。

### Summary

- 新しい field は足さない。`design` の `Where` を place、`plan` の `Commit` / `Stopped` を state にする。
- `close` は work done / dropped で始まり、祖先確認と merge ログを外す。`ex-` の `No` は `Triage` 行から読み、plan md に写さない。`collect.mjs` は `Triage` から読む。
- `base` の hash / `Stopped` / `yolo` の base の 1 行は、今の文面にすでにある。

### Paths

- `.pi/skills/close/SKILL.md`
- `.pi/skills/close/references/format.md`
- `.pi/skills/close/scripts/collect.mjs`
- `.pi/skills/plan/SKILL.md`
- `.pi/skills/plan/references/format.md`

### Boundary

- Plans: なし
- External: なし

## `yolo-pass`

### ADR & Where

- No: 03
- Why: `yolo` の work の pass と base を使わない規則が 1 つの入力（`yolo` / `work` / `design`）で、待つ plan は無い。prose なので owner が読む。
- Where: base — owner が `yolo` / `work` の文面を読む。

### Summary

- `yolo` の `work` は `Added` の owner の look（front の cmux-browser、`base` の slice）をパスする。owner を待たない。
- `yolo` は base plan を使わず、全 plan を worktree にする。
- agent の check は `Acceptance` に残す。check は、agent が `yolo` / `work` の文面を読み、front の plan で owner の stop が無いことを見る。

### Paths

- `.pi/skills/yolo/SKILL.md`
- `.pi/skills/work/SKILL.md`
- `.pi/skills/design/SKILL.md`

### Boundary

- Plans: なし
- External: なし
