import { describe, expect, it } from 'vitest';
import { gitEnv } from '../lib/git-env.mjs';
import { tmpDir } from './tmp.ts';

// `test/setup.ts` が効いているかを、テストの側から見る。ここが赤くなると、フックの中でテストが本体を汚せる状態に戻っている。

describe('テストの環境', () => {
  it('フックの GIT_* を引き継がず、HOME が一時ディレクトリを指す', () => {
    const dangerous = Object.keys(process.env).filter(
      (key) => key.startsWith('GIT_') && key !== 'GIT_CONFIG_GLOBAL' && key !== 'GIT_CONFIG_SYSTEM',
    );
    expect(dangerous).toEqual([]);
    expect(process.env.GIT_CONFIG_GLOBAL).not.toBeUndefined();
    expect(process.env.HOME ?? '').toContain('pi-test-home-');
  });

  it('git を打つ道具は、渡された GIT_* も process.env の GIT_* も落とす', () => {
    const passed = gitEnv({ GIT_DIR: '/x', GIT_INDEX_FILE: '/y', PATH: '/bin' });
    expect(Object.keys(passed).filter((key) => key.startsWith('GIT_'))).toEqual([]);
    expect(Object.entries(passed)).toContainEqual(['PATH', '/bin']);

    // 引数なしなら process.env から落とす（同じ for を通る）
    const key = 'GIT_SLICE1_PROBE';
    const before = process.env[key];
    process.env[key] = '/probe';
    try {
      const cleaned = gitEnv();
      expect(Object.keys(cleaned).filter((k) => k.startsWith('GIT_'))).toEqual([]);
      expect(cleaned.PATH).toBe(process.env.PATH);
    } finally {
      if (before === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = before;
      }
    }
  });
});

describe('tmpDir', () => {
  it('リポジトリの外に作る（テストが作業ツリーを汚さない）', () => {
    expect(tmpDir().startsWith(process.cwd())).toBe(false);
  });
});
