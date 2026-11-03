/**
 * consult の完了報告の表示のテスト。
 *
 * 折りたたみの1行（`noticeParts` と `noticeLine`）、展開とクリックでの開閉、レンダラーの登録を確かめる。
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { initTheme } from '@earendil-works/pi-coding-agent';
import type { MouseRegion, TuiMouseButton, TuiMouseEvent } from '@earendil-works/pi-tui';
import {
  isOpened,
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

/** 報告の詳細。テストごとに中身を変えない */
const details = {
  id: 'consult-1',
  type: 'code',
  state: 'done',
  turns: 21,
  spend: '0.0111 usd',
  files: ['run/log.ts'],
};

/** 報告のメッセージ。時刻は開閉の状態のキーになるため、テストごとに変える */
function aMessage(detailsOf: unknown, timestamp: number, content = '本文です'): NoticeMessage {
  return {
    role: 'custom',
    customType: 'consult',
    content,
    display: true,
    details: detailsOf,
    timestamp,
  };
}

/** クリックのイベント。座標は使わない */
function aClick(button: TuiMouseButton = 'left'): TuiMouseEvent {
  return {
    type: 'click',
    button,
    x: 0,
    y: 0,
    screenX: 0,
    screenY: 0,
    width: 78,
    height: 3,
    shift: false,
    alt: false,
    ctrl: false,
  };
}

/** 描いた行をつないだ文字列 */
function drawn(view: MouseRegion): string {
  return view.render(78).join('\n');
}

beforeAll(() => {
  // 本文は `Markdown` で描くため、テーマを先に用意する
  initTheme('dark', false);
});

describe('noticeLine', () => {
  it('id・type・state がある → 案内を添えた1行を返す', () => {
    const parts = noticeParts({ id: 'consult-1', type: 'code', state: 'done' });
    expect(noticeLine(parts, 'ctrl+o')).toBe(
      '[consult] consult-1 — code / done (ctrl+o かクリックで展開)',
    );
  });

  it('id・type だけがある → state のない1行を返す', () => {
    const parts = noticeParts({ id: 'consult-1', type: 'code' });
    expect(noticeLine(parts, 'ctrl+o')).toBe(
      '[consult] consult-1 — code (ctrl+o かクリックで展開)',
    );
  });

  it('details が undefined → 例外を投げずに [consult] だけの1行を返す', () => {
    const parts = noticeParts(undefined);
    expect(noticeLine(parts, 'ctrl+o')).toBe('[consult] (ctrl+o かクリックで展開)');
  });
});

describe('renderNotice', () => {
  it('展開している → turns・spend・files と本文を描画する', () => {
    const view = renderNotice(aMessage(details, 1), { expanded: true, outputPad: 1 }, plainTheme);
    const text = drawn(view);
    expect(text).toContain('turns: 21');
    expect(text).toContain('spend: 0.0111 usd');
    expect(text).toContain('files: run/log.ts');
    expect(text).toContain('本文です');
  });

  it('折りたたんでいる → 1行だけを描画し、turns・spend・files と本文を描画しない', () => {
    const view = renderNotice(aMessage(details, 2), { expanded: false, outputPad: 1 }, plainTheme);
    const text = drawn(view);
    expect(text).toContain('[consult] consult-1 — code / done');
    expect(text).not.toContain('turns: 21');
    expect(text).not.toContain('本文です');
  });

  it('閉じた報告を左クリックする → 開いた表示になる', () => {
    const view = renderNotice(aMessage(details, 11), { expanded: false, outputPad: 1 }, plainTheme);
    expect(drawn(view)).not.toContain('本文です');
    view.handleMouse(aClick());
    expect(drawn(view)).toContain('本文です');
  });

  it('開いた報告を左クリックする → 折りたたんだ表示になる', () => {
    const view = renderNotice(aMessage(details, 12), { expanded: false, outputPad: 1 }, plainTheme);
    view.handleMouse(aClick());
    expect(drawn(view)).toContain('本文です');
    view.handleMouse(aClick());
    expect(drawn(view)).not.toContain('本文です');
  });

  it('expanded が真でクリックによる開閉状態がない → 開いた表示になる', () => {
    const view = renderNotice(aMessage(details, 13), { expanded: true, outputPad: 1 }, plainTheme);
    expect(isOpened(13)).toBe(false);
    expect(drawn(view)).toContain('本文です');
  });

  it('button: right でクリックする → 表示は変わらない', () => {
    const view = renderNotice(aMessage(details, 14), { expanded: false, outputPad: 1 }, plainTheme);
    view.handleMouse(aClick('right'));
    expect(drawn(view)).not.toContain('本文です');
  });

  it('時刻の違う2件の報告のうち1件をクリックする → 開くのはその1件だけになる', () => {
    const first = renderNotice(
      aMessage(details, 15),
      { expanded: false, outputPad: 1 },
      plainTheme,
    );
    const second = renderNotice(
      aMessage(details, 16),
      { expanded: false, outputPad: 1 },
      plainTheme,
    );
    first.handleMouse(aClick());
    expect(drawn(first)).toContain('本文です');
    expect(drawn(second)).not.toContain('本文です');
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
