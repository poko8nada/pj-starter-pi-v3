import { describe, expect, it } from 'vitest';
import type { Theme } from '@earendil-works/pi-coding-agent';
import { cardText, createCard } from './render.ts';
import { prunePass } from '../../../../test/prune-fixture.ts';

function fakeTheme(): Theme {
  const theme = {
    fg: (_color: unknown, text: string): string => text,
    bg: (_color: unknown, text: string): string => text,
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 描画に使う fg と bg だけ持つ偽物
  return theme as unknown as Theme;
}

const shownCounts = [
  { value: 12345, shown: '12,345' },
  { value: 12036, shown: '12,036' },
  { value: 1234, shown: '1,234' },
] as const;

function smallPass() {
  return prunePass({
    tokensBefore: shownCounts[0].value,
    dropped: [{ id: 'e1', chars: shownCounts[2].value }],
    summary: '話題の要約',
    latencyMs: 1200,
  });
}

describe('cardText', () => {
  it('折りたたみ → 前後のトークン数と展開キー', () => {
    const pass = smallPass();
    const expandKey = 'ctrl+e';
    const lines = cardText(pass, false, expandKey);
    expect(lines).toHaveLength(3);
    expect(lines[2]).toBe(
      `Compacted from ${shownCounts[0].shown} → ${shownCounts[1].shown} tokens (${expandKey} to expand)`,
    );
  });

  it('折りたたみ → 展開キーをそのまま出す', () => {
    const pass = smallPass();
    const expandKey = 'ctrl+9';
    const lines = cardText(pass, false, expandKey);
    expect(lines[2]).toContain(`(${expandKey} to expand)`);
  });

  it('展開 → 見出し、要約、省略、秒数の順', () => {
    const pass = smallPass();
    const expandKey = 'ctrl+e';
    const lines = cardText(pass, true, expandKey);
    expect(lines).toEqual([
      '[prune]',
      '',
      `**Compacted from ${shownCounts[0].shown} → ${shownCounts[1].shown} tokens**`,
      '',
      pass.summary,
      '',
      `省略: ${pass.dropped.length} 件 / ${pass.droppedTokens} トークン / ${shownCounts[2].shown} 文字`,
      `要約と判定: ${(pass.latencyMs / 1000).toFixed(1)} 秒`,
    ]);
  });

  it('落としたトークンが 0 → 前と後が同じ', () => {
    const pass = prunePass({
      tokensBefore: 900,
      dropped: [],
      droppedChars: 0,
      droppedTokens: 0,
    });
    const lines = cardText(pass, false, 'ctrl+e');
    expect(lines[2]).toBe(
      `Compacted from ${pass.tokensBefore} → ${pass.tokensBefore} tokens (ctrl+e to expand)`,
    );
  });

  it('展開で dropped 0 件 → 省略 0 件 / 0 トークン / 0 文字', () => {
    const pass = prunePass({ dropped: [], droppedChars: 0, droppedTokens: 0 });
    const lines = cardText(pass, true, 'ctrl+e');
    expect(lines.join('\n')).toContain(
      `省略: ${pass.dropped.length} 件 / ${pass.droppedTokens} トークン / ${pass.droppedChars} 文字`,
    );
  });
});

describe('createCard', () => {
  it('偽の Theme で render → 折りたたみに印と前後のトークン', () => {
    const pass = smallPass();
    const lines = createCard(pass, fakeTheme()).render(80);
    expect(lines.some((line) => line.includes('[prune]'))).toBe(true);
    expect(
      lines.some((line) =>
        line.includes(`Compacted from ${shownCounts[0].shown} → ${shownCounts[1].shown} tokens`),
      ),
    ).toBe(true);
  });
});
