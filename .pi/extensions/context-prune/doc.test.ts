import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { defaultSettings } from './settings/schema.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');

function readRoot(name: string): string {
  return readFileSync(join(ROOT, name), 'utf8');
}

function count(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

/** Settings の表の行。表の行だけを見る（本文の同名を拾わない） */
function tableRow(readme: string, key: string): string {
  const line = readme.split('\n').find((row) => row.startsWith('|') && row.includes(`\`${key}\``));
  if (line === undefined) {
    throw new Error(`Settings table has no ${key}`);
  }
  return line;
}

describe('doc', () => {
  it('DEFINITION.md に context-prune の 1 行が 1 件', () => {
    const line =
      '- context-prune: エージェントが、古いツール結果のうち要らないものを送る文脈から外し、コンテキストを空けられる';
    const found = readRoot('DEFINITION.md')
      .split('\n')
      .filter((row) => row === line);
    expect(found).toHaveLength(1);
  });

  it('README.md に context-prune と /prune now と /prune on|off が各 1 件以上', () => {
    const readme = readRoot('README.md');
    expect(count(readme, 'context-prune')).toBeGreaterThanOrEqual(1);
    expect(count(readme, '/prune now')).toBeGreaterThanOrEqual(1);
    expect(count(readme, '/prune on|off')).toBeGreaterThanOrEqual(1);
  });

  it('README.ja.md に context-prune と /prune now と on / off が各 1 件以上', () => {
    const readme = readRoot('README.ja.md');
    expect(count(readme, 'context-prune')).toBeGreaterThanOrEqual(1);
    expect(count(readme, '/prune now')).toBeGreaterThanOrEqual(1);
    expect(count(readme, 'on')).toBeGreaterThanOrEqual(1);
    expect(count(readme, 'off')).toBeGreaterThanOrEqual(1);
  });

  it('拡張の README.md に 4 つの見出しが各 1 件', () => {
    const readme = readFileSync(join(HERE, 'README.md'), 'utf8');
    expect(count(readme, '## How it moves')).toBe(1);
    expect(count(readme, '## Commands')).toBe(1);
    expect(count(readme, '## Settings')).toBe(1);
    expect(count(readme, '## The code')).toBe(1);
  });

  it('Settings の表の ratio の既定が defaultSettings() と同じ', () => {
    const readme = readFileSync(join(HERE, 'README.md'), 'utf8');
    expect(tableRow(readme, 'ratio')).toContain(String(defaultSettings().ratio));
  });

  it('Settings の表の recentTokens の既定が defaultSettings() と同じ', () => {
    const readme = readFileSync(join(HERE, 'README.md'), 'utf8');
    expect(tableRow(readme, 'recentTokens')).toContain(String(defaultSettings().recentTokens));
  });
});
