/**
 * パスのカード。標準のコンパクションと同じ組み立てで描く。
 *
 * 折りたたみは 3 行、展開は要約と件数と秒数。クリックで切り替える。
 */

import { getMarkdownTheme, keyText, type Theme } from '@earendil-works/pi-coding-agent';
import {
  Box,
  Container,
  Markdown,
  MouseRegion,
  Spacer,
  Text,
  type Component,
  type MarkdownTheme,
} from '@earendil-works/pi-tui';
import type { PrunePass } from './data.ts';

function tokensLine(pass: PrunePass): string {
  return pass.tokensBefore.toLocaleString();
}

/** 折りたたみと展開の文。展開は Markdown を通す前提 */
export function cardText(pass: PrunePass, expanded: boolean, expandKey: string): readonly string[] {
  const tokens = tokensLine(pass);
  if (!expanded) {
    return ['[prune]', '', `Compacted from ${tokens} tokens (${expandKey} to expand)`];
  }
  return [
    '[prune]',
    '',
    `**Compacted from ${tokens} tokens**`,
    '',
    pass.summary,
    '',
    `省略: ${pass.dropped.length} 件 / ${pass.droppedChars.toLocaleString()} 文字`,
    '',
    `要約と判定: ${(pass.latencyMs / 1000).toFixed(1)} 秒`,
  ];
}

function paintCollapsed(content: Container, pass: PrunePass, theme: Theme): void {
  const label = theme.fg('customMessageLabel', '[prune]');
  content.addChild(new Text(label, 0, 0));
  content.addChild(new Spacer(1));
  const tokens = tokensLine(pass);
  content.addChild(
    new Text(
      theme.fg('customMessageText', `Compacted from ${tokens} tokens (`) +
        theme.fg('dim', keyText('app.tools.expand')) +
        theme.fg('customMessageText', ' to expand)'),
      0,
      0,
    ),
  );
}

function paintExpanded(
  content: Container,
  pass: PrunePass,
  theme: Theme,
  markdownTheme: MarkdownTheme,
): void {
  const label = theme.fg('customMessageLabel', '[prune]');
  const tokens = tokensLine(pass);
  content.addChild(new Text(label, 0, 0));
  content.addChild(new Spacer(1));
  content.addChild(
    new Markdown(`**Compacted from ${tokens} tokens**\n\n${pass.summary}`, 0, 0, markdownTheme, {
      color: (text) => theme.fg('customMessageText', text),
    }),
  );
  content.addChild(new Spacer(1));
  content.addChild(
    new Text(
      theme.fg(
        'customMessageText',
        `省略: ${pass.dropped.length} 件 / ${pass.droppedChars.toLocaleString()} 文字`,
      ),
      0,
      0,
    ),
  );
  content.addChild(
    new Text(
      theme.fg('customMessageText', `要約と判定: ${(pass.latencyMs / 1000).toFixed(1)} 秒`),
      0,
      0,
    ),
  );
}

/** パスのカードを作る。クリックで折りたたみと展開が切り替わる */
export function createCard(pass: PrunePass, theme: Theme, outputPad = 1): Component {
  const box = new Box(outputPad, 1, (text) => theme.bg('customMessageBg', text));
  const markdownTheme = getMarkdownTheme();
  let expanded = false;
  const paint = (): void => {
    box.clear();
    const content = new Container();
    if (expanded) {
      paintExpanded(content, pass, theme, markdownTheme);
    } else {
      paintCollapsed(content, pass, theme);
    }
    box.addChild(
      new MouseRegion(content, (event) => {
        if (event.type !== 'click' || event.button !== 'left') {
          return undefined;
        }
        expanded = !expanded;
        paint();
        box.invalidate();
        return { handled: true };
      }),
    );
  };
  paint();
  return box;
}
