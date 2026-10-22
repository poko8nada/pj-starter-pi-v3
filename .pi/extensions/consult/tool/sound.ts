/**
 * consult の音。5 秒ごとの tick で、走っているか渡していない完了があれば 1 音鳴らす。
 *
 * 合図は人に向けた物で、エージェントの関心ではない。鳴らなくても走行は止めない。
 * `enabled` は既定 on で、`/consult-sound on|off` が `setSoundEnabled` を呼ぶ。
 * セッションの間だけ効く。
 *
 * 鳴らす所（`player`）は差し替えられる。テストは afplay を起動しない物を渡す。
 * タイマーは `index.ts` が持つ。ここは 1 音鳴らすだけ。
 */

import { spawn } from 'node:child_process';

/** tick の間隔。渡していない完了と、走っている表示を見る周期 */
export const SOUND_INTERVAL_MS = 5000;

/** 鳴らす音のファイル */
const SOUND_FILE = '/System/Library/Sounds/Tink.aiff';

/** 音を 1 つ鳴らす口 */
export type Player = () => void;

/** afplay で Tink を 1 音鳴らす。鳴らない環境（afplay の無い OS、音の無い CI）でも走行は続ける */
function afplay(): void {
  try {
    spawn('afplay', [SOUND_FILE], { stdio: 'ignore', detached: true }).unref();
  } catch {
    // 音は補助。失敗しても本来の仕事を止めない。
  }
}

let player: Player = afplay;
let enabled = true;

/** 鳴らす所を差し替え、元に戻す関数を返す。テスト用 */
export function setPlayer(next: Player): () => void {
  const previous = player;
  player = next;
  return () => {
    player = previous;
  };
}

/** 音が鳴る設定か。`/consult-sound` が読む */
export function isSoundEnabled(): boolean {
  return enabled;
}

/** 音の on / off。既定 on */
export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

/** 1 音鳴らす。off のときは何もしない */
export function playSound(): void {
  if (!enabled) {
    return;
  }
  player();
}
