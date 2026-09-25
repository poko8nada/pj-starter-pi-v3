# PLAN 001

## Steps

### step 0: prepare

- Install: `pnpm install`
- Cleanup: なし
- Refactor: なし

### step 1: check-suite

- What: 検査を 1 コマンドで走らせる
  - `format`
  - `lint`
  - `typecheck`
  - `test`
- Depends: なし
- Action: verify
- Files:
  - `package.json`
  - `.oxlintrc.json`
  - `.oxfmtrc.json`
  - `tsconfig.json`
  - `vitest.config.ts`
- Tests: なし
  - 設定だけ
  - 検査そのものが対象

### step 2: commit-gate

- What: commit 時に同じ検査を回して、緑でなければ止める
- Depends: `check-suite`
- Action: verify
- Files: `lefthook.yaml`
- Tests: なし

### step 3: quality-gate.changed

- What: そのターンで変えた分だけを検査の対象にする
- Depends: `check-suite`
- Action: verify
- Files: `.pi/extensions/quality-gate/targets.ts`
- Tests: `.pi/extensions/quality-gate/targets.test.ts`

### step 4: quality-gate.checks

- What: 対象に 4 つの検査を回して、結果をまとめる
- Depends: `quality-gate.changed`
- Action: verify
- Files:
  - `.pi/extensions/quality-gate/checks.ts`
  - `.pi/extensions/quality-gate/report.ts`
- Tests: なし
  - 検査の起動は実演で確かめる

### step 5: quality-gate.pushback

- What:
  - 落ちたら差し戻す
  - 緑でないまま終えようとしたら戻す
  - 3 回で打ち切る
- Depends: `quality-gate.checks`
- Action: verify
- Files: `.pi/extensions/quality-gate/index.ts`
- Tests: なし
  - pi セッションが要る
  - 実演で確かめる

### step 6: agent-rules

- What:
  - エージェントが守る規則を書く
    - 1 枚を先に書く
    - 緑でないまま終わらない
    - 検査を弱めない
- Depends: なし
- Action: build
- Files: `AGENTS.md`
- Tests: なし
  - 文書
  - 実演で確かめる

## Structure

```
<pj-starter-pi-v3>/
├── AGENTS.md                                  add     エージェントの規則
├── CYCLE-DESIGN.md                            keep    一時物（002 でスキルに吸収して削除）
├── cycles/
│   └── 001-2026-09-20/
│       ├── definition.md                      add     このサイクルの定義
│       ├── plan.md                            add     このプラン
│       └── tickets/                           add     チケット
├── package.json                               keep    検査のスクリプト
├── lefthook.yaml                              keep    commit ゲート
├── tsconfig.json                              keep    typecheck
├── vitest.config.ts                           keep    test
├── .oxlintrc.json                             keep    lint の規則
├── .oxfmtrc.json                              keep    format の規則
├── .pi/
│   ├── tsconfig.json                          keep    拡張の型チェック
│   └── extensions/
│       └── quality-gate/
│           ├── index.ts                       keep    差し戻しと打ち切り
│           ├── checks.ts                      keep    検査の起動
│           ├── targets.ts                     keep    変えた分の検出
│           ├── report.ts                      keep    結果の整形
│           └── targets.test.ts                keep    指紋のテスト
└── scripts/
    └── typecheck-staged.mjs                   keep    typecheck の実装
```
