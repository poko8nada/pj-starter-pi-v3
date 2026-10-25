import { chmodSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { aTypePolicy, aTypesText } from '../consult.fixture.ts';
import { CONFIG_FILE, loadTypes, parseTypes, resolveType } from './types.ts';

// 設定の読み込みは毎回ファイルを触る。置き場は `test/temp-dir.ts` の helper（後始末も helper がする）。
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

  it('`tools` が空 → 投げる', () => {
    expect(() => parseTypes(aTypesText(aTypePolicy({ tools: [] })))).toThrow(
      /fewer than 1 items|must not be empty/,
    );
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

  it('`limits` が無い → 投げる', () => {
    expect(() => parseTypes(aTypesText({ ...aTypePolicy(), limits: undefined }))).toThrow(/limits/);
  });

  it('`turns` / `output` が 0 以下 → 投げる', () => {
    expect(() =>
      parseTypes(aTypesText(aTypePolicy({ limits: { turns: 0, output: 100 } }))),
    ).toThrow(/limits.turns.*greater than 0|turns/);
    expect(() => parseTypes(aTypesText(aTypePolicy({ limits: { turns: 1, output: -1 } })))).toThrow(
      /limits.output.*greater than 0|output/,
    );
  });

  it('`limits` が正の値 → そのまま通る', () => {
    const limits = { turns: 7, output: 1234 };
    const policy = aTypePolicy({ limits });
    expect(parseTypes(aTypesText(policy)).at(0)?.limits).toEqual(policy.limits);
  });

  it('`limits` の `turns` / `output` のキーが欠けている → 投げる', () => {
    expect(() => parseTypes(aTypesText({ ...aTypePolicy(), limits: { turns: 20 } }))).toThrow();
    expect(() => parseTypes(aTypesText({ ...aTypePolicy(), limits: { output: 20000 } }))).toThrow();
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

  it('types.json が無い → 理由の文面つきで投げる', () => {
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
