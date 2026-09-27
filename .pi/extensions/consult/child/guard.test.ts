import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isSecretPath, judgeToolCall, unquote } from './guard.ts';

/**
 * 実ファイルで確かめる。`isSecretPath` は realpath を使うので、
 * 存在しないパスでは判断の意味が変わる（それはそれで 1 つのケース）。
 */
let dir = '';

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'child-guard-'));
  mkdirSync(join(dir, 'sub/dir'), { recursive: true });
  mkdirSync(join(dir, 'keys'), { recursive: true });
  mkdirSync(join(dir, 'node_modules/react'), { recursive: true });
  writeFileSync(join(dir, '.env'), 'SECRET=1\n');
  writeFileSync(join(dir, 'sub/dir/.envrc'), 'x\n');
  writeFileSync(join(dir, 'keys/server.pem'), 'x\n');
  writeFileSync(join(dir, 'id.key'), 'x\n');
  writeFileSync(join(dir, 'README.md'), 'x\n');
  writeFileSync(join(dir, '.env.bak'), 'x\n');
  writeFileSync(join(dir, '.ENV'), 'x\n');
  writeFileSync(join(dir, 'foo.env'), 'x\n');
  writeFileSync(join(dir, 'id.key.bak'), 'x\n');
  writeFileSync(join(dir, 'node_modules/react/index.js'), 'x\n');
  symlinkSync(join(dir, '.env'), join(dir, 'link-to-env'));
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('isSecretPath', () => {
  it('絶対パスが .env', () => {
    expect(isSecretPath(join(dir, '.env'), dir)).toBe(true);
  });

  it('深い場所の .envrc', () => {
    expect(isSecretPath(join(dir, 'sub/dir/.envrc'), dir)).toBe(true);
  });

  it('keys/server.pem', () => {
    expect(isSecretPath(join(dir, 'keys/server.pem'), dir)).toBe(true);
  });

  it('id.key', () => {
    expect(isSecretPath(join(dir, 'id.key'), dir)).toBe(true);
  });

  it('相対パスは cwd で解決する', () => {
    expect(isSecretPath('../../.env', join(dir, 'sub/dir'))).toBe(true);
  });

  it('symlink の先が .env', () => {
    expect(isSecretPath(join(dir, 'link-to-env'), dir)).toBe(true);
  });

  it('README.md は通す', () => {
    expect(isSecretPath(join(dir, 'README.md'), dir)).toBe(false);
  });

  it('.ENV（大文字）は規則に無い', () => {
    expect(isSecretPath(join(dir, '.ENV'), dir)).toBe(false);
  });

  it('foo.env は前方一致しない', () => {
    expect(isSecretPath(join(dir, 'foo.env'), dir)).toBe(false);
  });

  it('id.key.bak は接尾辞が違う', () => {
    expect(isSecretPath(join(dir, 'id.key.bak'), dir)).toBe(false);
  });

  it('.env.bak は定義の名前（.env）ではない', () => {
    expect(isSecretPath(join(dir, '.env.bak'), dir)).toBe(false);
  });

  it('空文字は dir に解決され、秘密ではない', () => {
    expect(isSecretPath('', dir)).toBe(false);
  });

  it('存在しないパスは、名前が秘密でなければ通す（cat のような語で子が凍らない）', () => {
    expect(isSecretPath(join(dir, 'does-not-exist'), dir)).toBe(false);
  });

  it('存在しないが名前が秘密（まだ作られていない .env）は止める', () => {
    expect(isSecretPath(join(dir, 'sub/not-yet/.env'), dir)).toBe(true);
  });

  it('node_modules の中は広げない', () => {
    expect(isSecretPath(join(dir, 'node_modules/react/index.js'), dir)).toBe(false);
  });
});

describe('unquote', () => {
  it('二重引用符を剥がす', () => {
    expect(unquote('.e""nv')).toBe('.env');
  });

  it('単一引用符を剥がす', () => {
    expect(unquote(".e''nv")).toBe('.env');
  });

  it('バックスラッシュを剥がす', () => {
    expect(unquote('\\.env')).toBe('.env');
  });
});

describe('judgeToolCall', () => {
  it('read + .env を拒む', () => {
    expect(judgeToolCall('read', { path: join(dir, '.env') }, dir)).toEqual({
      block: true,
      reason: expect.stringContaining('読めない'),
    });
  });

  it('read + .envrc を拒む', () => {
    expect(judgeToolCall('read', { path: join(dir, 'sub/dir/.envrc') }, dir).block).toBe(true);
  });

  it('grep + keys/x.pem を拒む', () => {
    expect(judgeToolCall('grep', { path: join(dir, 'keys/server.pem') }, dir).block).toBe(true);
  });

  it('bash + cat /dir/.env を拒む', () => {
    expect(judgeToolCall('bash', { command: `cat ${join(dir, '.env')}` }, dir).block).toBe(true);
  });

  it('bash のコマンド名（cat）では止めない', () => {
    expect(judgeToolCall('bash', { command: 'ls -la' }, dir)).toEqual({});
  });

  it('bash + 存在しないパス（/nonexistent/x.txt）でも止めない', () => {
    expect(judgeToolCall('bash', { command: 'cat /nonexistent/x.txt' }, dir)).toEqual({});
  });

  it('bash + 組み立てたパス（.e""nv）を拒む', () => {
    expect(judgeToolCall('bash', { command: `cat ${join(dir, '.e""nv')}` }, dir).block).toBe(true);
  });

  it('bash + symlink を拒む', () => {
    expect(judgeToolCall('bash', { command: `cat ${join(dir, 'link-to-env')}` }, dir).block).toBe(
      true,
    );
  });

  it('bash + cat $HOME/.env を拒む（展開後の basename が .env）', () => {
    expect(judgeToolCall('bash', { command: 'cat $HOME/.env' }, dir).block).toBe(true);
  });

  it('bash + cat $UNSET/.env を拒む（未定義は空に展開され /.env になる）', () => {
    expect(judgeToolCall('bash', { command: 'cat $UNSET/.env' }, dir).block).toBe(true);
  });

  it('bash + cat .e${X}nv を拒む（展開後 .env）', () => {
    expect(judgeToolCall('bash', { command: 'cat .e${X}nv' }, dir).block).toBe(true);
  });

  it('bash + cat $(echo .env) を拒む（解決できない展開は通さない）', () => {
    expect(judgeToolCall('bash', { command: 'cat $(echo .env)' }, dir).block).toBe(true);
  });

  it('bash + cat ${X:-.env} を拒む（既定値付きの展開は解決できない）', () => {
    expect(judgeToolCall('bash', { command: 'cat ${X:-.env}' }, dir).block).toBe(true);
  });

  it("bash + cat $'\\x2eenv' を拒む（ANSI-C の引用符は解決できない）", () => {
    expect(judgeToolCall('bash', { command: "cat $'\\x2eenv'" }, dir).block).toBe(true);
  });

  it('bash + echo $? も拒む（値が決まらないものは通さない。止める側に倒す）', () => {
    expect(judgeToolCall('bash', { command: 'echo $?' }, dir).block).toBe(true);
  });

  it('bash + echo $PATH は通す（展開後も秘密の名前ではない）', () => {
    expect(judgeToolCall('bash', { command: 'echo $PATH' }, dir)).toEqual({});
  });

  it('read + file_path だけは通す（pi は path を渡すので見ない）', () => {
    expect(judgeToolCall('read', { file_path: 'sub/dir/.envrc' }, dir)).toEqual({});
  });

  it('bash + コマンド内の代入（FOO=.env; cat $FOO）は見ない（残る穴）', () => {
    expect(judgeToolCall('bash', { command: 'FOO=.env; cat $FOO' }, dir)).toEqual({});
  });

  it('read + README.md は通す', () => {
    expect(judgeToolCall('read', { path: join(dir, 'README.md') }, dir)).toEqual({});
  });

  it('ls + リポジトリ直は通す', () => {
    expect(judgeToolCall('ls', { path: dir }, dir)).toEqual({});
  });

  it('パスを取らない道具は通す', () => {
    expect(judgeToolCall('web_search', { query: 'hello' }, dir)).toEqual({});
  });

  it('空のパスは通す（存在しないので isSecretPath は true だが、空文字は見ない）', () => {
    expect(judgeToolCall('read', { path: '' }, dir)).toEqual({});
  });

  it('引数が空でも落ちない', () => {
    expect(judgeToolCall('read', {}, dir)).toEqual({});
  });
});
