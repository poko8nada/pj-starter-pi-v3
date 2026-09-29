import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { loadTypes, parseTypes, resolveType } from './types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

// 設定の読み込みは毎回ファイルを触る。置き場は `test/tmp.ts` の helper（後始末も helper がする）。
function writeConfig(text: string): string {
  const dir = tmpDir();
  writeFileSync(join(dir, 'types.json'), text);
  return dir;
}

/** 最小の正しい type。1 箇所だけ壊すのに使う */
function aType(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'review',
    models: [],
    tools: ['read'],
    readOnly: true,
    continueByDefault: false,
    limits: { turns: 20, output: 20000 },
    ...overrides,
  };
}

function config(...types: unknown[]): string {
  return JSON.stringify({ types });
}

describe('parseTypes', () => {
  it('正しい設定 → 4 つの type が引ける', () => {
    // 本体の設定を読む（読むだけで、書く物は helper に置く）。コミットしてある設定がそのまま読めることも確かめる。
    const committed = readFileSync(join(HERE, '..', 'types.json'), 'utf8');
    expect(parseTypes(committed).map((type) => type.name)).toEqual([
      'research',
      'review',
      'trial',
      'code',
    ]);
  });

  it('`models` が空 → 親のモデルで走る設定として通る', () => {
    expect(parseTypes(config(aType())).at(0)?.models).toEqual([]);
  });

  it('`role` が無い → 通る', () => {
    expect(parseTypes(config(aType())).at(0)?.role).toBeUndefined();
  });

  it('JSON が壊れている → 投げる', () => {
    expect(() => parseTypes('{')).toThrow(/not valid JSON/);
  });

  it('`types` が配列でない → 投げる', () => {
    expect(() => parseTypes('{"types":{}}')).toThrow(/`types` must be an array/);
  });

  it('`types` が空 → 投げる', () => {
    expect(() => parseTypes(config())).toThrow(/must not be empty/);
  });

  it('要素がオブジェクトでない → 投げる', () => {
    expect(() => parseTypes(config('review'))).toThrow(/types\[0\] must be an object/);
  });

  it('`name` が無い / 空 → 投げる', () => {
    expect(() => parseTypes(config(aType({ name: undefined })))).toThrow(/name/);
    expect(() => parseTypes(config(aType({ name: '  ' })))).toThrow(/name/);
  });

  it('`name` が重複 → 投げる', () => {
    expect(() => parseTypes(config(aType(), aType()))).toThrow(/duplicated/);
  });

  it('`models` が配列でない → 投げる', () => {
    expect(() => parseTypes(config(aType({ models: 'commandcode/x' })))).toThrow(
      /models must be an array/,
    );
  });

  it('`models` の要素が文字列でない → 投げる', () => {
    expect(() => parseTypes(config(aType({ models: [1] })))).toThrow(/models\[0\]/);
  });

  it('`tools` が配列でない → 投げる', () => {
    expect(() => parseTypes(config(aType({ tools: 'read' })))).toThrow(/tools must be an array/);
  });

  it('`tools` が空 → 投げる', () => {
    // 空だと「指定なし」として親のツールが通ってしまう。
    expect(() => parseTypes(config(aType({ tools: [] })))).toThrow(/must not be empty/);
  });

  it('未知のツール名 → 投げる', () => {
    expect(() => parseTypes(config(aType({ tools: ['read', 'reed'] })))).toThrow(
      /unknown tool: reed/,
    );
  });

  it('`readOnly` が true / false 以外 → 投げる', () => {
    expect(() => parseTypes(config(aType({ readOnly: 'yes' })))).toThrow(/readOnly/);
    expect(() => parseTypes(config(aType({ continueByDefault: 1 })))).toThrow(/continueByDefault/);
    expect(() => parseTypes(config(aType({ readOnly: undefined })))).toThrow(/readOnly/);
    expect(() => parseTypes(config(aType({ continueByDefault: undefined })))).toThrow(
      /continueByDefault/,
    );
  });

  it('`limits` が無い → 投げる', () => {
    expect(() => parseTypes(config(aType({ limits: undefined })))).toThrow(/limits/);
  });

  it('`turns` / `output` が 0 以下 → 投げる', () => {
    expect(() => parseTypes(config(aType({ limits: { turns: 0, output: 100 } })))).toThrow(/turns/);
    expect(() => parseTypes(config(aType({ limits: { turns: 1, output: -1 } })))).toThrow(/output/);
  });
});

describe('loadTypes', () => {
  it('設定を読み直す → 次の呼び出しに効く', () => {
    const dir = writeConfig(config(aType({ name: 'first' })));
    expect(loadTypes(dir).map((type) => type.name)).toEqual(['first']);

    writeFileSync(join(dir, 'types.json'), config(aType({ name: 'second' })));
    expect(loadTypes(dir).map((type) => type.name)).toEqual(['second']);
  });

  it('types.json が無い → 読めなかったファイルの名前と復元の案内を含む（error）', () => {
    const dir = tmpDir();
    const attempt = () => loadTypes(dir);
    expect(attempt).toThrow(/types\.json/);
    expect(attempt).toThrow(/restore it/);
  });

  it.skipIf(process.getuid?.() === 0)(
    '権限で読めない → 「コミットしてある」と言わない（error）',
    () => {
      const dir = tmpDir();
      const file = join(dir, 'types.json');
      writeFileSync(file, config(aType()));
      chmodSync(file, 0o000);
      const attempt = () => loadTypes(dir);
      expect(attempt).not.toThrow(/committed/);
      expect(attempt).toThrow(/could not read/);
    },
  );

  it('文面は例を写せと言わない（例のファイルはコミットしていない）', () => {
    const dir = tmpDir();
    expect(() => loadTypes(dir)).not.toThrow(/example/);
  });
});

describe('resolveType', () => {
  it('未知の type → 投げる', () => {
    const types = parseTypes(config(aType({ name: 'review' })));
    expect(() => resolveType(types, 'code')).toThrow(/unknown type: code/);
  });

  it('名前で引ける', () => {
    const types = parseTypes(config(aType({ name: 'review' }), aType({ name: 'code' })));
    expect(resolveType(types, 'code').name).toBe('code');
  });
});
