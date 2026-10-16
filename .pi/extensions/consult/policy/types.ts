/**
 * type の定義と設定の読み込み。
 *
 * type はサブエージェントの走り方の一式（モデル候補・ツール・書き込みの可否・続きの既定・上限・役割）を持つ。呼び出し側が選べるのは type の名前だけ。上書きの口は作らない。
 *
 * 壊れた設定は setup の誤りなので投げる。サブエージェントを走らせてから気づくのでは遅い。読み込みは呼び出しごと。設定を変えたら、次の consult から効く。
 *
 * 形は typebox のスキーマが 1 つの言い方。スキーマと型（`Static`）が同じ所から出るので、検証と型が食い違わない。
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Check, Errors } from 'typebox/value';
import { Type, type Static } from 'typebox';

export const CONFIG_FILE = 'types.json';

/**
 * サブエージェントに渡してよいツール。
 *
 * 打ち間違いを setup の時点で見つけるために列挙する。pi 側の一覧を引く口が無く、サブエージェントを走らせてからでは「ツールが無い」と「ツールが失敗した」の区別が付かない。
 */
export const KNOWN_TOOLS: ReadonlySet<string> = new Set([
  'read',
  'write',
  'edit',
  'quick_edit',
  'target_edit',
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

export type Limits = Static<typeof LimitsSchema>;
export type TypePolicy = Static<typeof TypePolicySchema>;

const LimitsSchema = Type.Object({
  /** ターン数の上限。0 以下は許さない */
  turns: Type.Number({ minimum: 1 }),
  /** 出力トークンの上限。0 以下は許さない */
  output: Type.Number({ minimum: 1 }),
});

/**
 * ツールの一覧。空は許さない。
 *
 * 空の指定は「ツール無し」ではなく「指定なし」としてメインエージェントのツールが通ってしまう。列挙（`KNOWN_TOOLS`）は `parseTypes` の `checkTools` が見るので、ここでは型と空だけ。
 */
const ToolsSchema = Type.Array(Type.String(), { minItems: 1 });

const TypePolicySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  /** 試す順の pi のモデル。空ならメインエージェントと同じ設定で走る */
  models: Type.Array(Type.String({ minLength: 1 })),
  tools: ToolsSchema,
  /** 隔離するか。true のロールは worktree が要る（メインエージェントのツリーを汚させない） */
  isolated: Type.Boolean(),
  /**
   * 書ける所。空は全部。読みは縛らない。
   *
   * エントリは、ファイル、ディレクトリ、または glob（`cycles/<YYMMDD-NNN-<branch>>/plan/<plan id>.md`）。
   * サブエージェントの cwd（worktree）からの相対で当てる。
   */
  paths: Type.Array(Type.String({ minLength: 1 })),
  /**
   * 打てるコマンドの接頭辞。空は全部。
   *
   * 先頭が一致するかだけを見る（`git` は `git status` を通す）。シェルは解さない。
   */
  bash: Type.Array(Type.String({ minLength: 1 })),
  /** `consult_run` の `continue` を省いたときの既定 */
  continueByDefault: Type.Boolean(),
  limits: LimitsSchema,
  /** システムプロンプトへの追記。無ければ素のサブエージェント */
  role: Type.Optional(Type.String({ minLength: 1 })),
});

function fail(message: string): never {
  throw new Error(`consult types: ${message}`);
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
  const { items, hasTypes } = topTypes(document);
  if (!hasTypes) {
    fail('`types` must be an array');
  }
  if (items.length === 0) {
    fail('`types` must not be empty');
  }
  const types = items.map((item, index) => {
    const type = checkType(item, `types[${index}]`);
    // スキーマは型まで。知らないツール名は列挙に無いので、ここで足して文面に名前を出す
    checkTools(type.tools, `types[${index}].tools`);
    return type;
  });
  const seen = new Set<string>();
  for (const type of types) {
    if (seen.has(type.name)) {
      fail(`the type name is duplicated: ${type.name}`);
    }
    seen.add(type.name);
  }
  return types;
}

/**
 * トップの `types` を配列で返す。無ければ空配列。
 *
 * 「`types` が無い」と「空配列」は呼ぶ側が区別したいので、存在は `hasTypes` で返す。
 */
function topTypes(document: unknown): { readonly items: unknown[]; readonly hasTypes: boolean } {
  if (typeof document !== 'object' || document === null || Array.isArray(document)) {
    fail('the config must be an object');
  }
  const types = (document as { types?: unknown }).types;
  if (!Array.isArray(types)) {
    return { items: [], hasTypes: false };
  }
  return { items: types, hasTypes: true };
}

/** 1 つの type をスキーマで確かめる。場所は `where` を頭に足す。`Check` が型も絞るので、戻り値は assertion なしで扱える */
function checkType(value: unknown, where: string): TypePolicy {
  if (!Check(TypePolicySchema, value)) {
    const first = Errors(TypePolicySchema, value)[0];
    const at =
      first === undefined
        ? where
        : `${where}.${first.instancePath.replace(/^\//, '').replaceAll('/', '.')}`;
    fail(`${at} ${first?.message ?? 'does not match the schema'} (got ${JSON.stringify(value)})`);
  }
  return value;
}

/** ツールの一覧を、列挙に無い名前まで確かめる。スキーマは「型」しか見ないので、知らない名前はここで足す */
function checkTools(tools: readonly string[], where: string): string[] {
  for (const tool of tools) {
    if (!KNOWN_TOOLS.has(tool)) {
      fail(`${where} has an unknown tool: ${tool} (known: ${[...KNOWN_TOOLS].join(', ')})`);
    }
  }
  return [...tools];
}

/** 失敗の種類。文面を原因で分けるのに使う */
function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/** `<dir>/types.json` を読んで type の一覧にする。毎回読む */
export function loadTypes(dir: string): readonly TypePolicy[] {
  const file = join(dir, CONFIG_FILE);
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    // 「コミットしてある。復元しろ」と言えるのは、ファイルが無いときだけ。権限やディレクトリの失敗は原因をそのまま見せる。
    const hint =
      errorCode(error) === 'ENOENT'
        ? ' It is committed in this repository: restore it, or put your own models in it'
        : '';
    throw new Error(`consult types: could not read ${file}.${hint} (${detail})`, { cause: error });
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
