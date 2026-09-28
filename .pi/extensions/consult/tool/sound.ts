/**
 * consult の音。子が走っている間だけ、5 秒ごとに 1 音鳴らす。
 *
 * 合図は人に向けた物で、エージェントの関心ではない。鳴らなくても走行は止めない。
 * タイマーは 1 本だけ持ち、子が 0 体になったら止める（子の増減は `consult.ts` が知らせる）。
 * `enabled` は既定 on で、`/consult-sound on|off` が `setSoundEnabled` を呼ぶ。セッションの間だけ効く。
 *
 * 鳴らす所（`player`）は差し替えられる。テストは afplay を起動しない物を渡す。
 */

import { spawn } from 'node:child_process';

/** 子が 1 体以上走っている間の、1 音の間隔 */
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
let timer: ReturnType<typeof setInterval> | undefined;

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

/** 音の on / off。既定 on。off の間もタイマーは子の数に従い、on に戻せばまた鳴る */
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

/** 子が走っている間のタイマーを 1 本だけ始める。すでにあれば何もしない */
export function startSound(): void {
  if (timer !== undefined) {
    return;
  }
  timer = setInterval(playSound, SOUND_INTERVAL_MS);
}

/** 子が 0 体になったら止める。無ければ何もしない */
export function stopSound(): void {
  if (timer === undefined) {
    return;
  }
  clearInterval(timer);
  timer = undefined;
}

/** タイマーが動いているか。テストが読む */
export function isSoundRunning(): boolean {
  return timer !== undefined;
}
