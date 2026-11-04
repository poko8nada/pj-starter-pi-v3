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

  it('(happy) `_ex-plan_` 行を持つ close.md で `ex-` の plan の `No` を読む → `ADR <NN>` の値になる', () => {
    expect(noOf(exId, exPlan, closeWithTriage)).toBe(adrNo);
  });

  it('(error) 旧い形の行だけを持つ close.md で `ex-` の plan の `No` を読む → null になる', () => {
    const oldKind = ['ex-', 'plan'].join('');
    const oldTriage = `# Close 001\n\n## Collected\n\nなし\n\n## Triage\n\n- 1: ${oldKind} ex-fix (ADR 02, xxx): why\n`;
    expect(noOf(exId, exPlan, oldTriage)).toBeNull();
  });

  it('(error) Triage 行が無い close.md で `ex-` の plan の `No` を読む → null になる', () => {
    expect(noOf(missingId, exMissingPlan, closeWithTriage)).toBeNull();
  });
});

describe('writeClose', () => {
  it('(happy) `_ex-plan_` 行を持つ close.md で収集する → `ex-` の plan の見出しが `ADR <NN>` になる', () => {
    const { cycle } = setupCycle(closeWithTriage);
    const closePath = writeClose(cycle);
    const text = readFileSync(closePath, 'utf8');
    expect(text).toContain(`### ${planId} (ADR ${adrNo})`);
    expect(text).toContain(`### ${exId} (ADR ${adrNo})`);
  });

  it('(error) 旧い形の行だけを持つ close.md で収集する → `ex-` の plan の見出しが `ADR 未特定` になる', () => {
    const oldKind = ['ex-', 'plan'].join('');
    const oldTriage = `# Close 001\n\n## Collected\n\nなし\n\n## Triage\n\n- 1: ${oldKind} ex-fix (ADR 02, xxx): why\n`;
    const { cycle } = setupCycle(oldTriage);
    const text = readFileSync(writeClose(cycle), 'utf8');
    expect(text).toContain(`### ${exId} (ADR 未特定)`);
  });

  it('(error) Triage 行が無い close.md で収集する → `ex-` の plan の見出しが `ADR 未特定` になる', () => {
    const { cycle } = setupCycle(closeWithTriage);
    const text = readFileSync(writeClose(cycle), 'utf8');
    expect(text).toContain(`### ${missingId} (ADR 未特定)`);
  });
});

describe('collectPlan with review', () => {
  it('(happy) planDoc に review で指摘を 1 つ渡す → ## Collected にその指摘が残りとして出る', () => {
    const doc = planDoc({ no: adrNo, name: planId, notes: 'なし', review: ['work review hole'] });
    const items = collectPlan(doc);
    expect(items.map((item) => item.finding)).toContain('work review hole');
    expect(items.map((item) => item.place)).toContain('Work Review Round 1');
    const root = tempDir();
    const cycle = join(root, '261024-001-dev');
    const planDir = join(cycle, 'plan');
    mkdirSync(planDir, { recursive: true });
    writeFileSync(join(planDir, `${planId}.md`), doc);
    writeFileSync(
      join(cycle, 'close.md'),
      '# Close 001\n\n## Collected\n\nなし\n\n## Triage\n\nなし\n',
    );
    const text = readFileSync(writeClose(cycle), 'utf8');
    expect(text).toContain(`### ${planId} (ADR ${adrNo})`);
    expect(text).toContain('work review hole');
    expect(text).toContain('Work Review Round 1');
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

  it('(rerun) 再実行で番号下の文脈を保ち番号を振り直す → 文脈が残り連番になる', () => {
    const root = tempDir();
    const cycle = join(root, '261024-001-dev');
    const planDir = join(cycle, 'plan');
    mkdirSync(planDir, { recursive: true });
    writeFileSync(
      join(planDir, `${planId}.md`),
      planDoc({ no: adrNo, name: planId, notes: 'first hole' }),
    );
    const closePath = writeClose(cycle);
    const first = readFileSync(closePath, 'utf8');
    const numbered = first.split('\n').find((line) => /^\d+\. /.test(line));
    expect(numbered).toBeDefined();
    if (numbered === undefined) return;
    writeFileSync(closePath, first.replace(`${numbered}\n`, `${numbered}\n  - kept context\n`));
    writeFileSync(
      join(planDir, 'beta.md'),
      planDoc({ no: adrNo, name: 'beta', notes: 'second hole' }),
    );
    const again = readFileSync(writeClose(cycle), 'utf8');
    expect(again).toContain('  - kept context');
    expect(again).toMatch(/^1\. /m);
    expect(again).toMatch(/^2\. /m);
    expect(again).toContain('second hole');
  });
});
