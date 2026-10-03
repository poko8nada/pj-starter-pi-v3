import { describe, expect, it } from 'vitest';
import { gitEnv } from '../.pi/extensions/consult/run/run.ts';

// `vitest.setup.ts` が効いているかを、テストの側から見る。ここが赤くなると、フックの中でテストが本体を汚せる状態に戻っている。

describe('テストの環境', () => {
  it('フックの GIT_* を引き継がず、HOME が一時ディレクトリを指す', () => {
    const dangerous = Object.keys(process.env).filter(
      (key) => key.startsWith('GIT_') && key !== 'GIT_CONFIG_GLOBAL' && key !== 'GIT_CONFIG_SYSTEM',
    );
    expect(dangerous).toEqual([]);
    expect(process.env.GIT_CONFIG_GLOBAL).not.toBeUndefined();
    expect(process.env.HOME ?? '').toContain('pi-test-home-');
  });

  it('git を打つ道具は、渡された GIT_* を落とす', () => {
    const cleaned = gitEnv({ GIT_DIR: '/x', GIT_INDEX_FILE: '/y', PATH: '/bin' });
    expect(Object.keys(cleaned).filter((key) => key.startsWith('GIT_'))).toEqual([]);
    expect(Object.entries(cleaned)).toContainEqual(['PATH', '/bin']);
  });
});
