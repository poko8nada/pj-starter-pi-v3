/**
 * 子への問い — 既定の質問と答えの形。
 *
 * 子に渡す指示は `opinionTask` が1か所で組む。窓があるときは窓と質問、窓が空のときは質問だけ。
 * 答えの形は2項目で、無い欄は `なし`。
 */

import type { Window } from './conversation.ts';

/** 既定で子に問うこと（提案・意見の穴） */
export const DEFAULT_QUESTION =
  '次の提案・意見の穴を指摘してください。直さず、根拠を示して、次の形で答えてください。\n' +
  '## Holes\n' +
  '成立しない点・根拠の無い前提があれば、どこがどう崩れるか\n' +
  '## Overlooked\n' +
  '見落としている前提・確かめていないことがあれば\n' +
  '無い欄は「なし」と書く。';

/** 窓の前置き。上が古いことを添える */
const WINDOW_HEAD = '以下は直近の会話である（上が古い）。判定の材料にせよ。';

/** 問うことを決める。空の `focus` は指定なしとみなす */
function questionOf(focus: string | undefined): string {
  if (focus === undefined || focus.trim() === '') {
    return DEFAULT_QUESTION;
  }
  return focus;
}

/** 子に渡す指示を組む。窓が空なら質問だけで走る */
export function opinionTask(window: Window, focus: string | undefined): string {
  const question = questionOf(focus);
  if (window.text.trim() === '') {
    return question;
  }
  return `${WINDOW_HEAD}\n\n${window.text}\n\n${question}`;
}
