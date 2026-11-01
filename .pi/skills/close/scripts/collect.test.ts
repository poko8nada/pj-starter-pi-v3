import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { closeDoc, planDoc } from './collect.fixture.ts';
import { tempDir } from '../../../../test/temp-dir.ts';
import { collectPlan, noOf, writeClose } from './collect.mjs';

const planId = 'alpha';
const exId = 'ex-fix';
const missingId = 'ex-missing';
const adrNo = '02';
const normalPlan = planDoc({ no: adrNo, name: planId, notes: `${planId} hole` });
const exPlan = planDoc({ name: exId, notes: `${exId} hole` });
const exMissingPlan = planDoc({ name: missingId, notes: `${missingId} hole` });
const closeWithTriage = closeDoc({ triages: [{ name: exId, no: adrNo }] });

function setupCycle(triageBody: string) {
  const root = tempDir();
  const cycle = join(root, '261024-001-dev');
  const planDir = join(cycle, 'plan');
  mkdirSync(planDir, { recursive: true });
  writeFileSync(join(planDir, `${planId}.md`), normalPlan);
  writeFileSync(join(planDir, `${exId}.md`), exPlan);
  writeFileSync(join(planDir, `${missingId}.md`), exMissingPlan);
  writeFileSync(join(cycle, 'close.md'), triageBody);
  return { cycle, planDir };
}

describe('noOf', () => {
  it('通常planのNoはplan mdから読む', () => {
    expect(noOf(planId, normalPlan, closeWithTriage)).toBe(adrNo);
  });

  it('`ex-` planは`- No:`が無くてもTriage行の`ADR <NN>`を読む', () => {
    expect(noOf(exId, exPlan, closeWithTriage)).toBe(adrNo);
  });

  it('Triage行が無い`ex-` planはnull（`未特定`）', () => {
    expect(noOf(missingId, exMissingPlan, closeWithTriage)).toBeNull();
  });
});

describe('writeClose', () => {
  it('`## Collected`の見出しにTriageのNoを付ける', () => {
    const { cycle } = setupCycle(closeWithTriage);
    const closePath = writeClose(cycle);
    const text = readFileSync(closePath, 'utf8');
    expect(text).toContain(`### ${planId} (ADR ${adrNo})`);
    expect(text).toContain(`### ${exId} (ADR ${adrNo})`);
  });
});

describe('collectPlan with review', () => {
  it('(happy) planDoc に review で指摘を 1 つ渡す → ## Collected にその指摘が残り物として出る', () => {
    const doc = planDoc({ no: adrNo, name: planId, notes: 'なし', review: ['work review hole'] });
    const items = collectPlan(doc);
    expect(items.map((item) => item.finding)).toContain('work review hole');
    expect(items.map((item) => item.place)).toContain('Work Review Round 1');
  });

  it('(empty) planDoc に review で なし を渡す → ## Collected が なし になる', () => {
    const root = tempDir();
    const cycle = join(root, '261024-001-dev');
    const planDir = join(cycle, 'plan');
    mkdirSync(planDir, { recursive: true });
    writeFileSync(
      join(planDir, `${planId}.md`),
      planDoc({ no: adrNo, name: planId, notes: 'なし', review: ['なし'] }),
    );
    writeFileSync(
      join(cycle, 'close.md'),
      '# Close 001\n\n## Collected\n\nなし\n\n## Triage\n\nなし\n',
    );
    const closePath = writeClose(cycle);
    const text = readFileSync(closePath, 'utf8');
    expect(text).toContain('## Collected\n\nなし');
  });
});
