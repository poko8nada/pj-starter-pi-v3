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

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

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
