/**
 * 品質ゲートのテストの前提を組み立てる fixture である。
 *
 * `checksSetup()` は、一時ディレクトリ、その中のファイルを作る関数、偽の `pi` を返す。
 * `fakePi()` と `tsFile()` は、このファイルの中だけで使う。
 * この fixture はテストの中だけで使う。テストの外で `checksSetup()` を呼ぶと、`tempDir()` がディレクトリを作り、`vitest` の `afterEach` が無いため残る。止まらない。
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tempDir } from '../../../../test/temp-dir.ts';
import type { ExecPort } from './checks.ts';

interface ExecCall {
  readonly command: string;
  readonly args: readonly string[];
}

interface ScriptResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

interface FakePi {
  readonly pi: ExecPort;
  readonly calls: readonly ExecCall[];
  /** `git check-ignore` の exit code。既定は 1（無視されたファイルなし） */
  setCheckIgnoreCode: (code: number) => void;
  /** `git check-ignore` が標準出力に書く（無視されたパス） */
  setIgnoredStdout: (stdout: string) => void;
  /** スクリプトごとの pnpm の結果を決める */
  setScriptResult: (script: string, result: ScriptResult) => void;
  /** すべての pnpm の結果をまとめて決める */
  setAllPnpm: (result: ScriptResult) => void;
}

/** exec を記録するだけの偽である。pnpm と git は起動しない。 */
function fakePi(): FakePi {
  const calls: ExecCall[] = [];
  let checkIgnoreCode = 1;
  let ignoredStdout = '';
  let defaultPnpm: ScriptResult = { code: 0, stdout: '', stderr: '' };
  const overrides = new Map<string, ScriptResult>();
  const pi: ExecPort = {
    exec: (command, args) => {
      calls.push({ command, args });
      if (command === 'git') {
        return Promise.resolve({
          stdout: ignoredStdout,
          stderr: '',
          code: checkIgnoreCode,
          killed: false,
        });
      }
      const script = args[1] ?? '';
      const result = overrides.get(script) ?? defaultPnpm;
      return Promise.resolve({ ...result, killed: false });
    },
  };
  return {
    pi,
    calls,
    setCheckIgnoreCode: (code) => {
      checkIgnoreCode = code;
    },
    setIgnoredStdout: (stdout) => {
      ignoredStdout = stdout;
    },
    setScriptResult: (script, result) => {
      overrides.set(script, result);
    },
    setAllPnpm: (result) => {
      defaultPnpm = result;
    },
  };
}

/** 1 つの ts ファイルを作り、絶対パスを返す。 */
function tsFile(dir: string, name: string): string {
  const file = join(dir, name);
  writeFileSync(file, 'x\n');
  return file;
}

export interface ChecksSetup {
  readonly dir: string;
  readonly tsFile: (name: string) => string;
  readonly fake: FakePi;
}

export function checksSetup(): ChecksSetup {
  const dir = tempDir();
  return {
    dir,
    tsFile: (name) => tsFile(dir, name),
    fake: fakePi(),
  };
}
