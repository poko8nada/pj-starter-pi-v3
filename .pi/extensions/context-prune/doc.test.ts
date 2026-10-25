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

  it('Settings の表の ratio の既定が defaultSettings() と同じ', () => {
    const readme = readFileSync(join(HERE, 'README.md'), 'utf8');
    expect(tableRow(readme, 'ratio')).toContain(String(defaultSettings().ratio));
  });

  it('Settings の表の recentTokens の既定が defaultSettings() と同じ', () => {
    const readme = readFileSync(join(HERE, 'README.md'), 'utf8');
    expect(tableRow(readme, 'recentTokens')).toContain(String(defaultSettings().recentTokens));
  });
});
