# PLAN `ex-cycle-trigger`

## Files

```text
README.md                update
README.ja.md             update
.pi/
  skills/
    adr/
      SKILL.md
    close/
      SKILL.md
    design/
      SKILL.md
    plan/
      SKILL.md
    work/
      SKILL.md
    yolo/
      SKILL.md
```

## Slices

## 1.段をいつ開くか

### Types

なし

### Steps

1. `README.md`:
   - `## Cycle` のコードブロックの 6 行それぞれに、その段をいつ開くかを足し、`.pi/skills/*/SKILL.md:3` の `description` の前半（`Use when ...`）の内容を `when` の節にする。
2. `README.ja.md`:
   - `## サイクル` のコードブロックの 6 行それぞれに、同じ内容を日本語で足す。

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - other — 6 行それぞれにその段をいつ開くかが書かれていることを、`.pi/skills/*/SKILL.md:3` の `description` の前半と突き合わせて確かめる

## Notes

### Slice 1: 段をいつ開くか

- Findings: なし
- Unplanned: なし
- Commit: e0c0f61 consult(ex-cycle-trigger): add open triggers to Cycle blocks
- Stopped: なし

## Review

### Round 1

- Stale:
  - なし — README.md:63-68 と README.ja.md:63-68 のみが変わり、旧文面を写す文書・コメント・テストは残らないことを grep で確認した（rules/readme.format.md:9-25 の雛形は Cycle を持たないため対象外）。
- Unlisted:
  - なし — diff は README.md:60-69 と README.ja.md:60-69 の2枚のみで、Files の update 2件と一致する。`.pi/skills/*/SKILL.md:3` の6件は無印の関連ファイルのまま変更なしである。
- Gaps:
  - なし — Added（plan/ex-cycle-trigger.md:44）が英日6行ずつの SKILL.md:3 前半との突合せを定め、diff の README.md:63-68・README.ja.md:63-68 は6段を満たす。6段という値は plan と ADR（cycles/261030-046-dev/adr.md:163）が決めた値であり穴ではない。
- Unproven:
  - なし — このスライスは Types なし・文書 Steps のみでテストファイルを持たず、壊れても緑に残るテストはない。
- Noise:
  - なし — テストステップがなく、型・スキーマ・制約が肩代わりする assert も、魔数・固定文字列のケースもない。
- Doubts:
  - なし

## Acceptance

- Ran: `pnpm test:run`（788 件）、`pnpm typecheck`（root と .pi が ok）、`pnpm lint`（警告込みで緑）、`pnpm format:check`（全ファイルが整形済み）、`Added` の読み合わせ（英日 6 行の `when` の節と `.pi/skills/*/SKILL.md:3` の前半の突合、6 行の作業内容が変わる前と同じであること）。
- Findings:
  - `README.md:65` と `README.ja.md:65` の `plan` の行で、「サブエージェントに渡せる」が `when` の節と行の末尾で重複していた。
    - fixed: 両方の行の末尾から重複した句を落とし、`Ran` の 4 つの検査を走らせ直した。
- Doubts: なし
