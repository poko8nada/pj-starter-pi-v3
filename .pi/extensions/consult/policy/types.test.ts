import { chmodSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { aTypePolicy, aTypesText } from '../consult.fixture.ts';
import { CONFIG_FILE, loadTypes, parseTypes, resolveType } from './types.ts';

// 設定の読み込みは毎回ファイルを触る。保存場所は `test/temp-dir.ts` の helper（後始末も helper がする）。
function writeConfig(text: string): string {
  const dir = tempDir();
  writeFileSync(join(dir, CONFIG_FILE), text);
  return dir;
}

describe('parseTypes', () => {
  it('正しい設定 → 渡した名前の type がその順で引ける', () => {
    const first = aTypePolicy({ name: 'alpha' });
    const second = aTypePolicy({ name: 'beta' });
    expect(parseTypes(aTypesText(first, second)).map((type) => type.name)).toEqual([
      first.name,
      second.name,
    ]);
  });

  it('`models` が空 → 通る', () => {
    const policy = aTypePolicy({ models: [] });
    expect(parseTypes(aTypesText(policy)).at(0)?.models).toEqual(policy.models);
  });

  it('JSON が壊れている → 投げる', () => {
    expect(() => parseTypes('{')).toThrow(/not valid JSON/);
  });

  it('ホストの編集道具（quick_edit / target_edit）も名前として通る', () => {
    const tools = ['read', 'quick_edit', 'target_edit'];
    const [type] = parseTypes(aTypesText(aTypePolicy({ tools })));
    expect(type?.tools).toEqual(tools);
  });

  it('未知のツール名 → 投げる', () => {
    const unknownTool = 'reed';
    expect(() => parseTypes(aTypesText(aTypePolicy({ tools: ['read', unknownTool] })))).toThrow(
      unknownTool,
    );
  });

  it('`paths` / `bash` は空を許す（空 = 全部）', () => {
    const policy = aTypePolicy({ paths: [], bash: [] });
    const [type] = parseTypes(aTypesText(policy));
    expect(type?.paths).toEqual(policy.paths);
    expect(type?.bash).toEqual(policy.bash);
  });

  it('`limits` が正の値 → そのまま通る', () => {
    const limits = { turns: 7, output: 1234 };
    const policy = aTypePolicy({ limits });
    expect(parseTypes(aTypesText(policy)).at(0)?.limits).toEqual(policy.limits);
  });
});

describe('loadTypes', () => {
  it('設定を読み直す → 次の呼び出しに効く', () => {
    const first = aTypePolicy({ name: 'first' });
    const second = aTypePolicy({ name: 'second' });
    const dir = writeConfig(aTypesText(first));
    expect(loadTypes(dir).map((type) => type.name)).toEqual([first.name]);

    writeFileSync(join(dir, CONFIG_FILE), aTypesText(second));
    expect(loadTypes(dir).map((type) => type.name)).toEqual([second.name]);
  });

  it('types.json がない → 理由の文面つきで投げる', () => {
    const dir = tempDir();
    const file = join(dir, 'types.json');
    const attempt = () => loadTypes(dir);
    expect(attempt).toThrow(file);
    expect(attempt).toThrow(/restore it/);
  });

  it.skipIf(process.getuid?.() === 0)('権限で読めない → 理由の文面つきで投げる', () => {
    const dir = tempDir();
    const file = join(dir, CONFIG_FILE);
    writeFileSync(file, aTypesText(aTypePolicy()));
    chmodSync(file, 0o000);
    const attempt = () => loadTypes(dir);
    expect(attempt).not.toThrow(/committed/);
    expect(attempt).toThrow(/could not read/);
  });
});

describe('resolveType', () => {
  it('未知の type → 投げる', () => {
    const policy = aTypePolicy({ name: 'review' });
    const types = parseTypes(aTypesText(policy));
    expect(() => resolveType(types, 'code')).toThrow(/unknown type: code/);
  });

  it('名前で引ける', () => {
    const first = aTypePolicy({ name: 'review' });
    const second = aTypePolicy({ name: 'code' });
    const types = parseTypes(aTypesText(first, second));
    expect(resolveType(types, second.name).name).toBe(second.name);
  });
});

describe('research の実物', () => {
  it('research は affected.md だけに書ける', () => {
    const extensionDir = dirname(dirname(fileURLToPath(import.meta.url)));
    const research = resolveType(loadTypes(extensionDir), 'research');
    expect(research.tools).toEqual(
      expect.arrayContaining(['edit', 'quick_edit', 'target_edit', 'write']),
    );
    expect(research.paths).toEqual(['cycles/*/affected.md']);
  });
});
