/**
 * テストが使う settings.json のファクトリ。
 *
 * 一時ディレクトリを作り、settings.json を書いて、そのディレクトリを返す。
 * thinking-scrub と context-precompact のテストが読む共有の品。
 *
 * 値と文字列を組み立て、一時ファイルを開く。
 * テストの外から読まれても、何も起きずに止まらない。
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tempDir } from './temp-dir.ts';

/** 一時ディレクトリに settings.json を書いて、そのディレクトリを返す */
export function settingsDirWith(document: unknown): string {
  const dir = tempDir();
  const body = typeof document === 'string' ? document : JSON.stringify(document);
  writeFileSync(join(dir, 'settings.json'), body);
  return dir;
}
