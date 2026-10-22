import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { keyText, type Theme } from '@earendil-works/pi-coding-agent';
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
  it('折りたたみ・tokensBefore 12345 → 3 行目が Compacted from 12,345 tokens (キー to expand)', () => {
    const lines = cardText(passOf(), false, keyText('app.tools.expand'));
    expect(lines).toHaveLength(3);
    expect(lines[2]).toBe(
      `Compacted from 12,345 tokens (${keyText('app.tools.expand')} to expand)`,
    );
  });

  it('展開 → 要約と省略 3 件 / 1,234 文字と要約と判定 1.2 秒を含む', () => {
    const text = cardText(passOf(), true, keyText('app.tools.expand')).join('\n');
    expect(text).toContain('話題の要約');
    expect(text).toContain('省略: 3 件 / 1,234 文字');
    expect(text).toContain('要約と判定: 1.2 秒');
  });

  it('展開・dropped 0 件 → 省略 0 件 / 0 文字', () => {
    const pass: PrunePass = { ...passOf(), dropped: [], droppedChars: 0 };
    const text = cardText(pass, true, keyText('app.tools.expand')).join('\n');
    expect(text).toContain('省略: 0 件 / 0 文字');
  });
});

describe('createCard', () => {
  it('偽の Theme で render(80) → 行のどれかに [prune] と Compacted from 12,345 tokens', () => {
    const lines = createCard(passOf(), fakeTheme()).render(80);
    expect(lines.some((line) => line.includes('[prune]'))).toBe(true);
    expect(lines.some((line) => line.includes('Compacted from 12,345 tokens'))).toBe(true);
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
