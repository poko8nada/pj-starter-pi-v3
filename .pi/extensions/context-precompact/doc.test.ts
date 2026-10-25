import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatCount } from './ui/count.ts';
import { chatText, noticeText } from './ui/status.ts';
import { SUMMARY_TIMEOUT_MS } from './settings/constants.ts';

const HERE = import.meta.dirname;
const ROOT = join(HERE, '..', '..', '..');

function readRoot(name: string): string {
  return readFileSync(join(ROOT, name), 'utf8');
}

// 旧名の不在を見る検証 grep にこの試験自体が当たらないよう、
// 旧名は組み立てて比べる。
const OLD_UNIT = ['context', 'prune'].join('-');
const OLD_COMMAND = ['/', 'prune'].join('');
const OLD_MODEL = ['J', 'ev'].join('');
const OLD_STACK = ['Stack', 'Agent', 'Classifier'].join('.');
const OLD_UNIT_LINE = ['Unit', OLD_UNIT].join('.');

/** 拡張の README.md が持つべき、実行と表示の文言 */
function readmeNeedles(): readonly string[] {
  return [
    'turn_end',
    'session_before_compact',
    'agent_before_settle',
    'keepRecentTokens',
    'thresholdRatio',
    '/precompact status|on|off|now',
    chatText({ kind: 'preparing' }),
    'ready (',
    'applied (',
    'failed',
    'default compaction',
    `${formatCount(SUMMARY_TIMEOUT_MS)} ms (5 minutes)`,
    noticeText('off'),
    noticeText('nothing'),
    noticeText('running'),
    'status:',
    'latest',
    'console',
  ];
}

describe('doc', () => {
  it('拡張の README.md に実行と表示の文言がある', () => {
    const readme = readFileSync(join(HERE, 'README.md'), 'utf8');
    for (const needle of readmeNeedles()) {
      expect(readme).toContain(needle);
    }
  });

  it('README.md に context-precompact と /precompact があり、旧名が無い', () => {
    const readme = readRoot('README.md');
    expect(readme).toContain('context-precompact');
    expect(readme).toContain('/precompact');
    expect(readme).not.toContain(OLD_UNIT);
    expect(readme).not.toContain(OLD_COMMAND);
    expect(readme).not.toContain(OLD_MODEL);
  });

  it('README.ja.md に context-precompact と /precompact があり、旧名が無い', () => {
    const readme = readRoot('README.ja.md');
    expect(readme).toContain('context-precompact');
    expect(readme).toContain('/precompact');
    expect(readme).not.toContain(OLD_UNIT);
    expect(readme).not.toContain(OLD_COMMAND);
    expect(readme).not.toContain(OLD_MODEL);
  });

  it('DEFINITION.md に Unit.context-precompact があり、旧名が無い', () => {
    const definition = readRoot('DEFINITION.md');
    expect(definition).toContain('context-precompact');
    expect(definition).toContain('- context-precompact:');
    expect(definition).not.toContain(OLD_UNIT_LINE);
    expect(definition).not.toContain(OLD_STACK);
  });
});
