/**
 * 音そのものを、差し替えた player と偽のタイマーで確かめる。
 *
 * afplay は起動しない。`setPlayer` に記録するだけの関数を渡し、実際に鳴る所をテストから外す。
 * `sound.ts` はモジュールに 1 つの状態（enabled、timer、player）を持つ。各テストの前に enabled と timer を既定へ戻し、player はテストごとに差し替える。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SOUND_INTERVAL_MS,
  isSoundEnabled,
  isSoundRunning,
  playSound,
  setPlayer,
  setSoundEnabled,
  startSound,
  stopSound,
} from './sound.ts';

describe('sound', () => {
  const played: string[] = [];

  beforeEach(() => {
    played.length = 0;
    vi.useFakeTimers();
    setSoundEnabled(true);
    stopSound();
    setPlayer(() => {
      played.push('tink');
    });
  });

  afterEach(() => {
    stopSound();
    setSoundEnabled(true);
    vi.useRealTimers();
  });

  it('startSound → 5 秒ごとに 1 音、stopSound で止まる', () => {
    startSound();
    expect(isSoundRunning()).toBe(true);

    vi.advanceTimersByTime(SOUND_INTERVAL_MS - 1);
    expect(played).toHaveLength(0);

    vi.advanceTimersByTime(1);
    expect(played).toHaveLength(1);

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);
    expect(played).toHaveLength(2);

    stopSound();
    expect(isSoundRunning()).toBe(false);
    vi.advanceTimersByTime(SOUND_INTERVAL_MS * 3);
    expect(played).toHaveLength(2);
  });

  it('startSound を重ねてもタイマーは 1 本 → 5 秒ごとに 1 音', () => {
    startSound();
    startSound();
    startSound();

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);
    expect(played).toHaveLength(1);

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);
    expect(played).toHaveLength(2);
  });

  it('setSoundEnabled(false) → 鳴らない', () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);

    startSound();
    vi.advanceTimersByTime(SOUND_INTERVAL_MS * 3);
    expect(played).toHaveLength(0);
  });

  it('子が 0 体のまま（startSound しない）→ 5 秒経っても鳴らない', () => {
    // 走っている子がいなければ、timer は 1 本も無い。
    expect(isSoundRunning()).toBe(false);

    vi.advanceTimersByTime(SOUND_INTERVAL_MS * 3);
    expect(played).toHaveLength(0);
  });

  it('鳴らす所を差し替えると、渡した物だけが呼ばれる', () => {
    const restore = setPlayer(() => {
      played.push('swapped');
    });

    playSound();
    expect(played).toEqual(['swapped']);

    restore();
    playSound();
    expect(played).toEqual(['swapped', 'tink']);
  });
});
