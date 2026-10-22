import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Theme } from '@earendil-works/pi-coding-agent';
import type { PrunePass } from './data.ts';
import { cardText, createCard } from './render.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

function fakeTheme(): Theme {
  const theme = {
    fg: (_color: unknown, text: string): string => text,
    bg: (_color: unknown, text: string): string => text,
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 描画に使う fg と bg だけ持つ偽物
  return theme as unknown as Theme;
}

function passOf(): PrunePass {
  return {
    at: 1000,
    tokensBefore: 12345,
    droppedTokens: 1309,
    summary: '話題の要約',
    dropped: [
      { id: 'e1', chars: 1000 },
      { id: 'e2', chars: 200 },
      { id: 'e3', chars: 34 },
    ],
    droppedChars: 1234,
    kept: 2,
    latencyMs: 1200,
    usage: undefined,
  };
}

describe('cardText', () => {
  it('折りたたみ → Compacted from 12,345 → 11,036 tokens (ctrl+e to expand)', () => {
    const lines = cardText(passOf(), false, 'ctrl+e');
    expect(lines).toHaveLength(3);
    expect(lines[2]).toBe('Compacted from 12,345 → 11,036 tokens (ctrl+e to expand)');
  });

  it('折りたたみ → 展開キーをそのまま出す（既定値に依らない）', () => {
    const lines = cardText(passOf(), false, 'ctrl+9');
    expect(lines[2]).toContain('(ctrl+9 to expand)');
  });

  it('展開 → 見出し、要約、空行、省略、秒数の順', () => {
    const lines = cardText(passOf(), true, 'ctrl+e');
    expect(lines).toEqual([
      '[prune]',
      '',
      '**Compacted from 12,345 → 11,036 tokens**',
      '',
      '話題の要約',
      '',
      '省略: 3 件 / 1,309 トークン / 1,234 文字',
      '要約と判定: 1.2 秒',
    ]);
  });

  it('折りたたみ・落としたトークンが 0 → 前と後が同じ', () => {
    const pass: PrunePass = { ...passOf(), droppedTokens: 0 };
    expect(cardText(pass, false, 'ctrl+e')[2]).toBe(
      'Compacted from 12,345 → 12,345 tokens (ctrl+e to expand)',
    );
  });

  it('展開・dropped 0 件 → 省略 0 件 / 0 トークン / 0 文字', () => {
    const pass: PrunePass = { ...passOf(), dropped: [], droppedTokens: 0, droppedChars: 0 };
    expect(cardText(pass, true, 'ctrl+e').join('\n')).toContain('省略: 0 件 / 0 トークン / 0 文字');
  });
});

describe('createCard', () => {
  it('偽の Theme で render(80) → 折りたたみに [prune] と前後のトークン', () => {
    const lines = createCard(passOf(), fakeTheme()).render(80);
    expect(lines.some((line) => line.includes('[prune]'))).toBe(true);
    expect(lines.some((line) => line.includes('Compacted from 12,345 → 11,036 tokens'))).toBe(true);
  });
});

describe('package.json', () => {
  it('peerDependencies が *、devDependencies が ^1.3.0', () => {
    const document: unknown = JSON.parse(
      readFileSync(join(HERE, '..', '..', '..', '..', 'package.json'), 'utf8'),
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- package.json の依存表を読む
    const pkg = document as {
      readonly peerDependencies?: Readonly<Record<string, string>>;
      readonly devDependencies?: Readonly<Record<string, string>>;
    };
    expect(pkg.peerDependencies?.['@earendil-works/pi-tui']).toBe('*');
    expect(pkg.devDependencies?.['@earendil-works/pi-tui']).toBe('^1.3.0');
  });
});
