import { describe, expect, it } from 'vitest';
import { OPINION_ROOT, opinionRoot } from './root.ts';

// 文字列を組むだけ。子の起動も一時ディレクトリも要らない。

describe('opinionRoot', () => {
  it('CONSULT_ROOT があればその下に cwd ごとの置き場', () => {
    expect(opinionRoot('/a/b', { CONSULT_ROOT: '/tmp/x' })).toBe('/tmp/x/second-opinion-b');
  });

  it('env が無ければ既定の下', () => {
    expect(opinionRoot('/a/b', {})).toBe(`${OPINION_ROOT}/second-opinion-b`);
  });
});
