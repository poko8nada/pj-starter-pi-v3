/**
 * 音そのものを、差し替えた player で確かめる。
 *
 * afplay は起動しない。`setPlayer` に記録するだけの関数を渡し、実際に鳴る所をテストから外す。
 * `sound.ts` はモジュールに 1 つの状態（enabled、player）を持つ。テストごとに enabled と player を戻す。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isSoundEnabled, playSound, setPlayer, setSoundEnabled } from './sound.ts';

describe('sound', () => {
  const played: string[] = [];

  beforeEach(() => {
    played.length = 0;
    setSoundEnabled(true);
    setPlayer(() => {
      played.push('tink');
    });
  });

  afterEach(() => {
    setSoundEnabled(true);
  });

  it('playSound → 差し替えた player が 1 回呼ばれる', () => {
    playSound();
    expect(played).toEqual(['tink']);
  });

  it('enabled が off → 鳴らさない', () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);

    playSound();

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
