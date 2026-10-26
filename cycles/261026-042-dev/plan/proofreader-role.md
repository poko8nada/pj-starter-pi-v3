# PLAN `proofreader-role`

- No: 02

## Files

```text
.pi/extensions/consult/
  README.md                         update
  index.ts                          update
  types.json                        update
  consult.fixture.ts
  tool/
    run.ts                          update
    run.test.ts
  sub/
    guard.test.ts                   update
    guard.ts
    spec.ts
  policy/
    types.ts
    types.test.ts
  run/
    subagent.ts
```

## Slices

## 1.役割

### Types

なし

### Steps

1. `.pi/extensions/consult/types.json`:
   - `review` の項目の次に、`proofreader` の項目を足します。`models` は `review` と同じ 2 つ、`tools` は `read`、`ls`、`find`、`grep`、`edit`、`quick_edit`、`target_edit`、`write`、`isolated` は `false`、`paths` は `["**/*.md", "**/.*/**/*.md"]`、`bash` は空の配列、`continueByDefault` は `false`、`limits` は `{ "turns": 80, "output": 120000 }`、`role` は次の文面です。

     ```text
     あなたは日本語の校正者です。渡された md を、日本語としてだけ直します。

     見るものは、次の 10 種類だけです。
     - 主語と述語の欠落
     - 係り受けの破綻
     - 指示語の参照先の不明
     - 語彙の不統一
     - 読点の過不足
     - 冗長
     - 曖昧
     - 常体と敬体の混在
     - 同じ語の重複
     - 意味の通らない文

     見ないものは、内容と決定の妥当性です。決定が正しいか、案が妥当か、順序が良いかは判断しません。

     箇条書きの数と並びは、冗長の解消と係り受けの修復に必要な範囲で変えます。文書の形が `format.md` で定められている場合は、その形を保ちます。

     書き直しは、ファイルを編集して行います。提案を返しません。`quick_edit`、`target_edit`、`write` で直し、書き換えるのは md だけです。

     報告は、次の形で返します。
     - 直した所: `<file>:<line>` — 何を直したか（1 行に 1 箇所）
     - 直さなかった所: `<file>:<line>` — 観点に当たるが、意味を変えずに直せなかった所
     - 止まった所: 上限に達したとき、どこまで直したか
     ```

2. `.pi/extensions/consult/README.md`:
   - 役割の表に 1 行足します。名は `proofreader`、道具は読みの 4 つと書きの 4 つ、場所はベース、ターンは 80、出力は 120,000、`continue` の既定は no です。
   - `paths` の説明の段落に、1 文足します。md だけを書ける役割があり、`["**/*.md", "**/.*/**/*.md"]` の 2 つで、点で始まるディレクトリの md も届くと書きます。

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - other — `.pi/extensions/consult/types.json` を読み、`proofreader` の項目が在り、`isolated` が false、`paths` が 2 つ、`limits` がターン 80・出力 120000 であることを確かめる。

## 2.文面と検査

### Types

なし

### Steps

1. `.pi/extensions/consult/index.ts`:
   - `promptSnippet` の役割の並びに、`proofreader` を足します（`:227`）。
2. `.pi/extensions/consult/tool/run.ts`:
   - `role` の説明の役割の並びに、`proofreader` を足します（`:14`）。
3. `.pi/extensions/consult/sub/guard.test.ts`:
   - (happy) `pathAllowed('cycles/261026-042-dev/adr.md', '/w', ['**/*.md', '**/.*/**/*.md'])` → `true`
   - (happy) `pathAllowed('.pi/skills/adr/SKILL.md', '/w', ['**/*.md', '**/.*/**/*.md'])` → `true`
   - (error) `pathAllowed('src/a.ts', '/w', ['**/*.md', '**/.*/**/*.md'])` → `false`
   - (happy) `judgeToolCall('write', { path: 'cycles/261026-042-dev/design.md' }, '/w', { state: 'set', paths: ['**/*.md', '**/.*/**/*.md'], bash: [] })` → 止めない
   - (error) `judgeToolCall('write', { path: 'src/a.ts' }, '/w', { state: 'set', paths: ['**/*.md', '**/.*/**/*.md'], bash: [] })` → `block`

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - other — マージの直後にベースで 1 回。`cycles/261026-041-dev/adr.md` の写しを `/tmp` に置き、`proofreader` に渡して差分を読む。`Status`、`Adopted`、セクション名、数値の意味が変わらず、日本語の異常が直っていること。

## Notes

### Slice 1: 役割

- Findings: なし
- Unplanned: なし
- Commit: 063dd62cd387b120bfa1fd3c52c358c9de660eb6
- Stopped:

### Slice 2: 文面と検査

- Findings:
  - マージ直後のベースでのproofreader実行を確かめていません。
    - left: マージ後にベースで1回行う検査のため、worktreeの段階では行えません。受け入れまたはマージ直後に行う必要があります。
- Unplanned: なし
- Commit: b02789bb739f1b6b90d9c6bdf029e24cd9c3462b
- Stopped:

### Cleanup: md許可の重複と読むだけの通過

- Findings: なし
- Unplanned: なし

## Review

### Round 1

- Stale: なし — 役割を並べる文面は `.pi/extensions/consult/index.ts:227` と `.pi/extensions/consult/tool/run.ts:15` の2か所とも追随し、他に列挙は無いことを確かめた。`README.md:22-32` の表と説明は計画どおりで、古い文面は残っていない。
- Unlisted: なし — 差分の5件は `Files` の `update` の5件と一致する。残る7件は汎用の追随で変える必要が無いことを確かめた（`sub/guard.ts:218-234`、`sub/spec.ts:31-84`、`policy/types.ts:57-82`、`run/subagent.ts:57-88`、`consult.fixture.ts:18-31`、`tool/run.test.ts:7-12`、`policy/types.test.ts:15-83`）。計画mdの差分は記録のため数えない。
- Gaps: なし — 計画の5件の検査は4つの `it` に束ねても `expect` は5件とも残り（`sub/guard.test.ts:219-242`）、許可と拒否の両方向を確かめている。削った `ls` の通過は読みの縛り無しと同じ枝で、`sub/guard.test.ts:112-118` と `sub/guard.test.ts:200-203` が今も確かめている。
- Unproven: なし — 許可と拒否が対で効き、片方だけ壊れても緑にならない（`sub/guard.test.ts:221-226` と `sub/guard.test.ts:233-241`）。`types.json:32-43` との直結は `Added` の目視が担い、自動検査の責めではない。
- Noise: なし — 新しい断言の値と文は計画とADRが決めたもので、型や制約が保証する前提の再掲では無い。削った `ls` は誰も気づかない単独の通過で、掃除は妥当である（`sub/guard.test.ts:116-118`）。
- Doubts:
  - マージ直後のベースでの `proofreader` 実行は未了で、受け入れまたはマージ直後に行う（`Notes` の `Slice 2` の `left` どおり）。これを除けば差分は計画を閉じられる。

## Acceptance

- Ran: `pnpm test:run`（55 本、721 件）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`。`guard.test.ts` の md の許可のケースは、`patterns` から点で始まるディレクトリのパターンを抜いて赤になることを確かめ、戻した。`types.json` を読み、`proofreader` の項目が `isolated: false`、`paths` が 2 つ、`limits` がターン 80・出力 120000 であることを確かめた。
- Findings: `Added` の 1 つ（マージの直後にベースで、`cycles/261026-041-dev/adr.md` の写しに `proofreader` を当てて差分を読む）は、ワークツリーの段では走らせられない。
  - left: マージの直後にベースで 1 回行います。
- Doubts: なし
