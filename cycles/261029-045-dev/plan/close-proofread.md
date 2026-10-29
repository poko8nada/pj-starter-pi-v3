# PLAN `close-proofread`

- No: 05

## Files

```text
.pi/
  skills/
    close/
      SKILL.md                 update
```

## Slices

## 1.proofread

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/close/SKILL.md:64-71`:
   - proofread のステップを、`cycles/<YYMMDD>-<NNN>-<slug>/close.md` と `.pi/skills/close/references/format.md` を名指す一文とパスにします。
   - `proofreader` の方針に従い、名指したファイルだけを編集すると書きます。
   - `proofreader` の報告と `git diff` を読み、`Triage` の行、`Verified` の行、行き先のいずれかの意味が変わったら `.pi/skills/close/references/format.md` の形に戻すことと、1 ラウンドで終えることを残します。

### Verify

- Always:
  - 既定の 5 つ。
- Added:
  - other — `grep -i 'close.md'` と `grep -i 'references/format.md'` が `.pi/skills/close/SKILL.md` の proofread のセクションに当たる。
  - other — `grep -i 'one round'` が `.pi/skills/close/SKILL.md` の proofread のセクションに当たり、名指したファイルだけを編集する規則が残っている。
  - other — `grep -i 'Triage'`、`grep -i 'Verified'`、`grep -i 'git diff'` が `.pi/skills/close/SKILL.md` の proofread のセクションに当たり、意味が変わったら `.pi/skills/close/references/format.md` の形に戻す規則が残っている。
  - base — オーナーが `.pi/skills/close/SKILL.md` の文面を読み、OK を返す。

## Notes

### Slice 1: proofread

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
