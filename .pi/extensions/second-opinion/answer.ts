/**
 * 子への問い — 既定の質問と答えの形。
 *
 * 子に渡す指示は `opinionTask` が1か所で組む。窓があるときは窓と質問、窓が空のときは質問だけ。
 * 答えの形は5項目で、無い欄は `なし`、全体15行以内に収める。
 */

import type { Window } from './conversation.ts';

/** 既定で子に問うこと（矛盾・穴・別案） */
export const DEFAULT_QUESTION =
  '次の会話を材料に、一貫性・穴・別案を判定してください。次の形で答えてください。\n' +
  '## Consistent\n' +
  '会話が一貫しているか。一貫していない所があれば、どこがどう食い違っているか\n' +
  '## Holes\n' +
  '抜けている点・確かめていない前提があれば\n' +
  '## Alternative\n' +
  '別の案があれば\n' +
  '## Cannot judge\n' +
  '判断できないことがあれば、その理由\n' +
  '## Read\n' +
  '読んだ発言の範囲（直近何件か）\n' +
  '無い欄は「なし」と書く。全体は15行以内。';

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
