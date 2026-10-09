import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../test/tmp.ts';
import { append, logPath, prune, type LogRecord } from './log.ts';
import { defaultSettings } from './settings.ts';

function routeRecord(): LogRecord {
  return {
    at: '2026-10-09T12:00:00',
    hook: 'route',
    owner_prompt: 'hello',
    label: 'question',
    confidence: 0.9,
    probabilities: { question: 0.9 },
    thresholds: defaultSettings().thresholds,
    decision: 'act',
    shadow: true,
    guide: 'would',
    text: 'guide text',
    truncated: false,
    outcome: {
      kind: 'answered',
      provider: 'opencode',
      model: 'jev-1.13-free',
      stopReason: 'stop',
      usage: { input: 1, output: 0, cost: 0 },
      latencyMs: 5,
    },
  };
}

function judgeRecord(): LogRecord {
  return {
    at: '2026-10-09T12:01:00',
    hook: 'judge',
    owner_prompt: 'hello',
    label: 'question',
    score: 1.8,
    confidence: 0.8,
    thresholds: defaultSettings().thresholds,
    decision: 'fire',
    shadow: true,
    stop: 'would',
    text: 'stop text',
    truncated: false,
    turn_index: 2,
    outcome: {
      kind: 'answered',
      provider: 'opencode',
      model: 'jev-1.13-free',
      stopReason: 'stop',
      usage: { input: 1, output: 0, cost: 0 },
      latencyMs: 5,
    },
  };
}

function dayName(at: Date): string {
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(
    at.getDate(),
  ).padStart(2, '0')}.jsonl`;
}

describe('append', () => {
  it('route と judge の2件 → 1行1件の JSONL', () => {
    const dir = tmpDir();
    append(routeRecord(), dir);
    append(judgeRecord(), dir);
    const text = readFileSync(join(dir, '2026-10-09.jsonl'), 'utf8');
    const lines = text.split('\n').filter((line) => line !== '');
    expect(lines).toHaveLength(2);
    const first: unknown = JSON.parse(lines[0] ?? '');
    const second: unknown = JSON.parse(lines[1] ?? '');
    expect(first).toMatchObject({ hook: 'route' });
    expect(second).toMatchObject({ hook: 'judge' });
  });

  it('ディレクトリが無い所へ append → 作って書く', () => {
    const dir = join(tmpDir(), 'nest', 'logs');
    append(routeRecord(), dir);
    expect(readFileSync(join(dir, '2026-10-09.jsonl'), 'utf8')).toContain('"route"');
  });
});

describe('logPath', () => {
  it('日付の境でファイルが替わる', () => {
    const dir = tmpDir();
    expect(logPath(dir, new Date('2026-10-09T23:59:59'))).toBe(join(dir, '2026-10-09.jsonl'));
    expect(logPath(dir, new Date('2026-10-10T00:00:01'))).toBe(join(dir, '2026-10-10.jsonl'));
  });
});

describe('prune', () => {
  it('14日前は残り、15日前は消える', () => {
    const dir = tmpDir();
    const at = new Date(2026, 9, 20, 12, 0, 0);
    const keep = new Date(2026, 9, 6, 12, 0, 0);
    const drop = new Date(2026, 9, 5, 12, 0, 0);
    writeFileSync(join(dir, dayName(keep)), '{}\n');
    writeFileSync(join(dir, dayName(drop)), '{}\n');
    writeFileSync(join(dir, dayName(at)), '{}\n');
    const removed = prune(dir, 14, at);
    expect(removed).toBe(1);
    expect(readFileSync(join(dir, dayName(keep)), 'utf8')).toBe('{}\n');
  });

  it('memo.txt は消えず、戻りは 0', () => {
    const dir = tmpDir();
    writeFileSync(join(dir, 'memo.txt'), 'hello\n');
    expect(prune(dir, 14, new Date(2026, 9, 20, 12, 0, 0))).toBe(0);
    expect(readFileSync(join(dir, 'memo.txt'), 'utf8')).toBe('hello\n');
  });
});
