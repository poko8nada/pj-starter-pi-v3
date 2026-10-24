import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { noOf, writeClose } from './collect.mjs';

const normalPlan = `# PLAN \`alpha\`

- No: 02

## Notes

### Slice 1: foo

- Findings:
  - alpha hole
- Unplanned:
  - なし
- Commit: abc1234
`;

const exPlan = `# PLAN \`ex-fix\`

## Notes

### Slice 1: bar

- Findings:
  - ex hole
- Unplanned:
  - なし
- Commit: def5678
`;

const exMissingPlan = `# PLAN \`ex-missing\`

## Notes

### Slice 1: baz

- Findings:
  - missing hole
- Unplanned:
  - なし
- Commit: ghi9012
`;

const closeWithTriage = `# Close 001

## Collected

なし

## Triage

- 1: ex-plan ex-fix (ADR 02, xxx): why
`;

function setupCycle(triageBody: string) {
  const root = tempDir();
  const cycle = join(root, '261024-001-dev');
  const planDir = join(cycle, 'plan');
  mkdirSync(planDir, { recursive: true });
  writeFileSync(join(planDir, 'alpha.md'), normalPlan);
  writeFileSync(join(planDir, 'ex-fix.md'), exPlan);
  writeFileSync(join(planDir, 'ex-missing.md'), exMissingPlan);
  writeFileSync(join(cycle, 'close.md'), triageBody);
  return { cycle, planDir };
}

describe('noOf', () => {
  it('通常planのNoはplan mdから読む', () => {
    expect(noOf('alpha', normalPlan, closeWithTriage)).toBe('02');
  });

  it('`ex-` planは`- No:`が無くてもTriage行の`ADR <NN>`を読む', () => {
    expect(noOf('ex-fix', exPlan, closeWithTriage)).toBe('02');
  });

  it('Triage行が無い`ex-` planはnull（`未特定`）', () => {
    expect(noOf('ex-missing', exMissingPlan, closeWithTriage)).toBeNull();
  });
});

describe('writeClose', () => {
  it('`## Collected`の見出しにTriageのNoを付ける', () => {
    const { cycle } = setupCycle(closeWithTriage);
    const closePath = writeClose(cycle);
    const text = readFileSync(closePath, 'utf8');
    expect(text).toContain('### alpha (ADR 02)');
    expect(text).toContain('### ex-fix (ADR 02)');
    expect(text).toContain('### ex-missing (ADR 未特定)');
  });
});
