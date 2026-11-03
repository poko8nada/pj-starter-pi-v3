/**
 * consult の完了報告の表示のテスト。
 *
 * 折りたたみの1行（`noticeParts` と `noticeLine`）、展開したときの描画、レンダラーの登録を確かめる。
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { initTheme } from '@earendil-works/pi-coding-agent';
import {
  noticeLine,
  noticeParts,
  registerNotice,
  renderNotice,
  type NoticeMessage,
  type NoticePaint,
  type NoticeRegistry,
} from './notice.ts';

/** 色を付けないテーマ。表示は `fg` と `bg` だけを使う */
const plainTheme: NoticePaint = {
  fg: (_color, text) => text,
  bg: (_color, text) => text,
};

/** 報告のメッセージ。`details` はテストごとに差し替える */
function aMessage(details: unknown, content = '本文です'): NoticeMessage {
  return {
    role: 'custom',
    customType: 'consult',
    content,
    display: true,
    details,
    timestamp: 1,
  };
}

/** 描いた行をつないだ文字列 */
function drawnOf(message: NoticeMessage, expanded: boolean): string {
  return renderNotice(message, { expanded, outputPad: 1 }, plainTheme).render(78).join('\n');
}

beforeAll(() => {
  // 本文は `Markdown` で描くため、テーマを先に用意する
  initTheme('dark', false);
});

describe('noticeLine', () => {
  it('id・type・state がある → 案内を添えた1行を返す', () => {
    const parts = noticeParts({ id: 'consult-1', type: 'code', state: 'done' });
    expect(noticeLine(parts, 'ctrl+o')).toBe('[consult] consult-1 — code / done (ctrl+o で展開)');
  });

  it('id・type だけがある → state のない1行を返す', () => {
    const parts = noticeParts({ id: 'consult-1', type: 'code' });
    expect(noticeLine(parts, 'ctrl+o')).toBe('[consult] consult-1 — code (ctrl+o で展開)');
  });

  it('details が undefined → 例外を投げずに [consult] だけの1行を返す', () => {
    const parts = noticeParts(undefined);
    expect(noticeLine(parts, 'ctrl+o')).toBe('[consult] (ctrl+o で展開)');
  });
});

describe('renderNotice', () => {
  it('展開している → turns・spend・files と本文を描画する', () => {
    const message = aMessage({
      id: 'consult-1',
      type: 'code',
      state: 'done',
      turns: 21,
      spend: '0.0111 usd',
      files: ['run/log.ts'],
    });
    const drawn = drawnOf(message, true);
    expect(drawn).toContain('turns: 21');
    expect(drawn).toContain('spend: 0.0111 usd');
    expect(drawn).toContain('files: run/log.ts');
    expect(drawn).toContain('本文です');
  });

  it('折りたたんでいる → 1行だけを描画し、turns・spend・files と本文を描画しない', () => {
    const message = aMessage({
      id: 'consult-1',
      type: 'code',
      state: 'done',
      turns: 21,
      spend: '0.0111 usd',
      files: ['run/log.ts'],
    });
    const drawn = drawnOf(message, false);
    expect(drawn).toContain('[consult] consult-1 — code / done');
    expect(drawn).not.toContain('turns: 21');
    expect(drawn).not.toContain('本文です');
  });
});

describe('registerNotice', () => {
  it('登録する → consult のレンダラーとして renderNotice を渡す', () => {
    const received: Array<[string, unknown]> = [];
    const registry: NoticeRegistry = {
      registerMessageRenderer: (customType, renderer) => {
        received.push([customType, renderer]);
      },
    };
    registerNotice(registry);
    expect(received).toEqual([['consult', renderNotice]]);
  });
});
