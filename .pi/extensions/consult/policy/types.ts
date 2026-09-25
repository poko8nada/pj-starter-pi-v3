/**
 * type の定義と設定の読み込み。
 *
 * type は子の走り方の一式（モデル候補・ツール・環境・上限・役割）を持つ。呼び出し側が選べるのは type の名前だけ。上書きの口は作らない。
 *
 * 壊れた設定は setup の誤りなので投げる。子を走らせてから気づくのでは遅い。読み込みは呼び出しごと。設定を変えたら、次の consult から効く。
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** 子をどこで走らせるか。`tree` は実ツリー、`worktree` は隔離した作業ツリー */
export type Environment = 'tree' | 'worktree';

export interface Limits {
  /** ターン数の上限 */
  readonly turns: number;
  /** 出力トークンの上限 */
  readonly output: number;
}

export interface TypePolicy {
  readonly name: string;
  /** 試す順の pi のモデル。空なら親と同じ設定で走る */
  readonly models: readonly string[];
  readonly tools: readonly string[];
  readonly environment: Environment;
  readonly limits: Limits;
  /** システムプロンプトへの追記。無ければ素の子 */
  readonly role?: string;
}

export const CONFIG_FILE = 'types.json';

/**
 * 子に渡してよいツール。
 *
 * 打ち間違いを setup の時点で見つけるために列挙する。pi 側の一覧を引く口が無く、子を走らせてからでは「ツールが無い」と「ツールが失敗した」の区別が付かない。
 */
export const KNOWN_TOOLS: ReadonlySet<string> = new Set([
  'read',
  'write',
  'edit',
  'bash',
  'grep',
  'find',
  'ls',
  'powershell',
  'web_search',
  'fetch_content',
  'source_check',
  'get_search_content',
]);

function fail(message: string): never {
  throw new Error(`consult types: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown, where: string): Record<string, unknown> {
  if (!isRecord(value)) {
    fail(`${where} must be an object`);
  }
  return value;
}

function asString(value: unknown, where: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${where} must be a non-empty string`);
  }
  return value;
}

function asStringArray(value: unknown, where: string): string[] {
  if (!Array.isArray(value)) {
    fail(`${where} must be an array`);
  }
  return value.map((item, index) => asString(item, `${where}[${index}]`));
}

function asPositiveNumber(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    fail(`${where} must be a positive number`);
  }
  return value;
}

function parseTools(value: unknown, where: string): string[] {
  const tools = asStringArray(value, where);
  if (tools.length === 0) {
    // 空の指定は「ツール無し」ではなく「指定なし」として親のツールが通ってしまう。
    fail(`${where} must not be empty`);
  }
  for (const tool of tools) {
    if (!KNOWN_TOOLS.has(tool)) {
      fail(`${where} has an unknown tool: ${tool} (known: ${[...KNOWN_TOOLS].join(', ')})`);
    }
  }
  return tools;
}

function parseEnvironment(value: unknown, where: string): Environment {
  if (value !== 'tree' && value !== 'worktree') {
    fail(`${where} must be "tree" or "worktree"`);
  }
  return value;
}

function parseLimits(value: unknown, where: string): Limits {
  const raw = asRecord(value, where);
  return {
    turns: asPositiveNumber(raw.turns, `${where}.turns`),
    output: asPositiveNumber(raw.output, `${where}.output`),
  };
}

function parseType(value: unknown, where: string): TypePolicy {
  const raw = asRecord(value, where);
  const role = raw.role === undefined ? undefined : asString(raw.role, `${where}.role`);
  return {
    name: asString(raw.name, `${where}.name`),
    models: asStringArray(raw.models, `${where}.models`),
    tools: parseTools(raw.tools, `${where}.tools`),
    environment: parseEnvironment(raw.environment, `${where}.environment`),
    limits: parseLimits(raw.limits, `${where}.limits`),
    ...(role === undefined ? {} : { role }),
  };
}

/** 設定の本文を type の一覧にする。壊れていれば投げる */
export function parseTypes(text: string): readonly TypePolicy[] {
  let document: unknown;
  try {
    document = JSON.parse(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    fail(`the config is not valid JSON (${detail})`);
  }
  const raw = asRecord(document, 'the config');
  if (!Array.isArray(raw.types)) {
    fail('`types` must be an array');
  }
  if (raw.types.length === 0) {
    fail('`types` must not be empty');
  }
  const types = raw.types.map((item, index) => parseType(item, `types[${index}]`));
  const seen = new Set<string>();
  for (const type of types) {
    if (seen.has(type.name)) {
      fail(`the type name is duplicated: ${type.name}`);
    }
    seen.add(type.name);
  }
  return types;
}

/** `<dir>/types.json` を読んで type の一覧にする。毎回読む */
export function loadTypes(dir: string): readonly TypePolicy[] {
  const file = join(dir, CONFIG_FILE);
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `consult types: could not read ${file}. Copy ${CONFIG_FILE.replace('.json', '.example.json')} and put your own models in it (${detail})`,
      { cause: error },
    );
  }
  return parseTypes(text);
}

/** 名前から type を引く。知らない名前は投げる */
export function resolveType(types: readonly TypePolicy[], name: string): TypePolicy {
  const found = types.find((type) => type.name === name);
  if (found === undefined) {
    const known = types.map((type) => type.name).join(', ');
    fail(`unknown type: ${name} (known: ${known})`);
  }
  return found;
}
