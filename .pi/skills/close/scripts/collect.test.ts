import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { planDoc } from './collect.fixture.ts';
import { tempDir } from '../../../../test/temp-dir.ts';
import { collectPlan, noOf, planName, writeClose } from './collect.mjs';

const planId = 'alpha';
const adrNo = '02';
const planFile = '01-alpha.md';
const betaId = 'beta';
const betaFile = '02-beta.md';
const normalPlan = planDoc({ no: adrNo, name: planId, notes: `${planId} hole` });
const betaPlan = planDoc({ no: adrNo, name: betaId, notes: `${betaId} hole` });

function setupCycle() {
  const root = tempDir();
  const cycle = join(root, '261024-001-dev');
  const planDir = join(cycle, 'plan');
  mkdirSync(planDir, { recursive: true });
  writeFileSync(join(planDir, planFile), normalPlan);
  writeFileSync(join(planDir, betaFile), betaPlan);
  writeFileSync(
    join(cycle, 'close.md'),
    '# Close 001\n\n## Collected\n\nなし\n\n## Triage\n\nなし\n',
  );
  return { cycle, planDir };
}

describe('planName', () => {
  it('(happy) NN付きのファイル名から番号とidを出す', () => {
    expect(planName(planFile)).toEqual({ nn: '01', id: planId });
  });

  it('(error) 番号の無いファイル名では投げる', () => {
    expect(() => planName(`${planId}.md`)).toThrow();
  });
});

describe('noOf', () => {
  it('plan mdのNoを読む', () => {
    expect(noOf(normalPlan)).toBe(adrNo);
  });

  it('(empty) Noの無いplan mdはnullになる', () => {
    expect(noOf(planDoc({ name: planId, notes: 'a hole' }))).toBeNull();
  });
});

describe('writeClose', () => {
  it('(happy) 通常 2 件の一時ツリーで収集する → NN の数値の順に並ぶ', () => {
    const { cycle } = setupCycle();
    const text = readFileSync(writeClose(cycle), 'utf8');
    expect(text).toContain(`### 01 ${planId} (ADR ${adrNo})`);
    expect(text).toContain(`### 02 ${betaId} (ADR ${adrNo})`);
    expect(text.indexOf(`### 01 ${planId}`)).toBeLessThan(text.indexOf(`### 02 ${betaId}`));
  });

  it('(happy) Noの無いplan mdは見出しが `ADR 未特定` になる', () => {
    const { cycle } = setupCycle();
    writeFileSync(join(cycle, 'plan', planFile), planDoc({ name: planId, notes: 'a hole' }));
    const text = readFileSync(writeClose(cycle), 'utf8');
    expect(text).toContain(`### 01 ${planId} (ADR 未特定)`);
  });

  it('(happy) 番号行の下の文脈を保つ', () => {
    const { cycle } = setupCycle();
    const closePath = writeClose(cycle);
    const first = readFileSync(closePath, 'utf8');
    const numbered = first.split('\n').find((line) => /^\d+\. /.test(line));
    expect(numbered).toBeDefined();
    if (numbered === undefined) return;
    writeFileSync(closePath, first.replace(`${numbered}\n`, `${numbered}\n  - kept context\n`));
    const second = readFileSync(writeClose(cycle), 'utf8');
    expect(second).toContain('kept context');
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
    writeFileSync(join(planDir, planFile), doc);
    writeFileSync(
      join(cycle, 'close.md'),
      '# Close 001\n\n## Collected\n\nなし\n\n## Triage\n\nなし\n',
    );
    const text = readFileSync(writeClose(cycle), 'utf8');
    expect(text).toContain(`### 01 ${planId} (ADR ${adrNo})`);
    expect(text).toContain('work review hole');
    expect(text).toContain('Work Review Round 1');
  });

  it('(empty) planDoc に review で なし を渡す → ## Collected が なし になる', () => {
    const root = tempDir();
    const cycle = join(root, '261024-001-dev');
    const planDir = join(cycle, 'plan');
    mkdirSync(planDir, { recursive: true });
    writeFileSync(
      join(planDir, planFile),
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

  it('(happy) 再実行で番号下の文脈を保つ → 鍵が `<plan id>:<line>` のままで文脈が残る', () => {
    const root = tempDir();
    const cycle = join(root, '261024-001-dev');
    const planDir = join(cycle, 'plan');
    mkdirSync(planDir, { recursive: true });
    writeFileSync(
      join(planDir, planFile),
      planDoc({ no: adrNo, name: planId, notes: 'first hole' }),
    );
    const closePath = writeClose(cycle);
    const first = readFileSync(closePath, 'utf8');
    const numbered = first.split('\n').find((line) => /^\d+\. /.test(line));
    expect(numbered).toBeDefined();
    if (numbered === undefined) return;
    writeFileSync(closePath, first.replace(`${numbered}\n`, `${numbered}\n  - kept context\n`));
    writeFileSync(
      join(planDir, '02-beta.md'),
      planDoc({ no: adrNo, name: 'beta', notes: 'second hole' }),
    );
    const again = readFileSync(writeClose(cycle), 'utf8');
    expect(again).toContain('  - kept context');
    expect(again).toMatch(/^1\. /m);
    expect(again).toMatch(/^2\. /m);
    expect(again).toContain('second hole');
    expect(again).toContain(`### 01 ${planId} (ADR ${adrNo})`);
  });
});

describe('collectPlan with Policy', () => {
  it('(happy) planDoc に Policy の観点を渡す → Policy の指摘が残りとして出る', () => {
    const doc = planDoc({
      no: adrNo,
      name: planId,
      notes: 'なし',
      review: ['Policy: a policy hole'],
    });
    const items = collectPlan(doc);
    expect(items.map((item) => item.finding)).toContain('a policy hole');
    expect(items.map((item) => item.place)).toContain('Work Review Round 1');
  });
});
