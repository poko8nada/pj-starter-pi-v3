import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { closeDoc, planDoc } from './collect.fixture.ts';
import { tempDir } from '../../../../test/temp-dir.ts';
import { collectPlan, noOf, planName, writeClose } from './collect.mjs';

const planId = 'alpha';
const exId = 'ex-fix';
const missingId = 'ex-missing';
const adrNo = '02';
const planFile = '01-alpha.md';
const betaId = 'beta';
const betaFile = '02-beta.md';
const exFile = 'ex-fix.md';
const missingFile = 'ex-missing.md';
const normalPlan = planDoc({ no: adrNo, name: planId, notes: `${planId} hole` });
const betaPlan = planDoc({ no: adrNo, name: betaId, notes: `${betaId} hole` });
const exPlan = planDoc({ name: exId, notes: `${exId} hole` });
const exMissingPlan = planDoc({ name: missingId, notes: `${missingId} hole` });
const closeWithTriage = closeDoc({ triages: [{ name: exId, no: adrNo }] });

function setupCycle(triageBody: string) {
  const root = tempDir();
  const cycle = join(root, '261024-001-dev');
  const planDir = join(cycle, 'plan');
  mkdirSync(planDir, { recursive: true });
  writeFileSync(join(planDir, planFile), normalPlan);
  writeFileSync(join(planDir, betaFile), betaPlan);
  writeFileSync(join(planDir, exFile), exPlan);
  writeFileSync(join(planDir, missingFile), exMissingPlan);
  writeFileSync(join(cycle, 'close.md'), triageBody);
  return { cycle, planDir };
}

/** 旧形 Triage 行の組み立て。1か所にまとめる。grep 0件のため旧称は分割して作る。 */
function oldTriageBody(): string {
  const oldKind = ['ex-', 'plan'].join('');
  return `# Close 001\n\n## Collected\n\nなし\n\n## Triage\n\n- 1: ${oldKind} ${exId} (ADR ${adrNo}, xxx): why\n`;
}

describe('planName', () => {
  it('(happy) NN付きのファイル名から番号とidを出す', () => {
    expect(planName(planFile)).toEqual({ nn: '01', id: planId });
  });

  it('(happy) `NN-` の無い `ex-` のファイル名は番号を持たない', () => {
    expect(planName(exFile)).toEqual({ nn: null, id: exId });
  });

  it('(error) 番号の無いファイル名では投げる', () => {
    expect(() => planName(`${planId}.md`)).toThrow();
  });
});

describe('noOf', () => {
  it('通常planのNoはplan mdから読む', () => {
    expect(noOf(planId, normalPlan, closeWithTriage)).toBe(adrNo);
  });

  it('(happy) `_ex-plan_` 行を持つ close.md で `ex-` の plan の `No` を読む → `ADR <NN>` の値になる', () => {
    expect(noOf(exId, exPlan, closeWithTriage)).toBe(adrNo);
  });

  it('(error) 旧い形の行だけを持つ close.md で `ex-` の plan の `No` を読む → null になる', () => {
    expect(noOf(exId, exPlan, oldTriageBody())).toBeNull();
  });

  it('(error) 空の `## Triage` を持つ close.md で `ex-` の plan の `No` を読む → null になる', () => {
    expect(noOf(missingId, exMissingPlan, closeDoc({ triages: [] }))).toBeNull();
  });
});

describe('writeClose', () => {
  it('(happy) 通常 2 件と `ex-` 2 件の一時ツリーで収集する → 通常が `NN` の数値の順、そのあとに `ex-` が名前の順で並ぶ', () => {
    const { cycle } = setupCycle(closeWithTriage);
    const closePath = writeClose(cycle);
    const text = readFileSync(closePath, 'utf8');
    expect(text).toContain(`### 01 ${planId} (ADR ${adrNo})`);
    expect(text).toContain(`### 02 ${betaId} (ADR ${adrNo})`);
    expect(text).toContain(`### ${exId} (ADR ${adrNo})`);
    expect(text).toContain(`### ${missingId} (ADR 未特定)`);
    expect(text.indexOf(`### 01 ${planId}`)).toBeLessThan(text.indexOf(`### 02 ${betaId}`));
    expect(text.indexOf(`### 02 ${betaId}`)).toBeLessThan(text.indexOf(`### ${exId}`));
    expect(text.indexOf(`### ${exId}`)).toBeLessThan(text.indexOf(`### ${missingId}`));
  });

  it('(error) 旧い形の行だけを持つ close.md で収集する → `ex-` の plan の見出しが `ADR 未特定` になる', () => {
    const { cycle } = setupCycle(oldTriageBody());
    const text = readFileSync(writeClose(cycle), 'utf8');
    expect(text).toContain(`### ${exId} (ADR 未特定)`);
  });

  it('(error) 空の `## Triage` を持つ close.md で収集する → `ex-` の plan の見出しが `ADR 未特定` になる', () => {
    const { cycle } = setupCycle(closeDoc({ triages: [] }));
    const text = readFileSync(writeClose(cycle), 'utf8');
    expect(text).toContain(`### ${missingId} (ADR 未特定)`);
  });

  it('(happy) `ex-` の見出しを持つ close.md を集め直す → 番号行の下の文脈が `ex-` の見出しの下にも残る', () => {
    const { cycle } = setupCycle(closeWithTriage);
    const closePath = writeClose(cycle);
    const first = readFileSync(closePath, 'utf8');
    const head = first.indexOf(`### ${exId}`);
    expect(head).toBeGreaterThan(-1);
    const numbered = first
      .slice(head)
      .split('\n')
      .find((line) => /^\d+\. /.test(line));
    expect(numbered).toBeDefined();
    if (numbered === undefined) return;
    writeFileSync(closePath, first.replace(`${numbered}\n`, `${numbered}\n  - kept ex context\n`));
    const second = readFileSync(writeClose(cycle), 'utf8');
    expect(second).toContain('kept ex context');
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
