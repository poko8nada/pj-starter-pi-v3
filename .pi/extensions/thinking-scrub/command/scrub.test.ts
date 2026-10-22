import { describe, expect, it } from 'vitest';
import { parseCommand, runCommand, type CommandPort } from './scrub.ts';
import type { SettingsRead } from '../settings/schema.ts';
import type { Status } from '../state/cell.ts';

// CommandPort は記録する偽物で渡す。

function fakePort(
  overrides: {
    readonly settings?: SettingsRead;
    readonly status?: Status;
  } = {},
): {
  readonly port: CommandPort;
  readonly written: boolean[];
  readonly shown: boolean[];
} {
  const written: boolean[] = [];
  const shown: boolean[] = [];
  const settings: SettingsRead = overrides.settings ?? {
    kind: 'ok',
    settings: { enabled: true, show: true },
  };
  const status: Status = overrides.status ?? { removed: 0, lastAt: null, failures: 0 };
  return {
    written,
    shown,
    port: {
      settings: () => settings,
      status: () => status,
      writeEnabled: (enabled) => {
        written.push(enabled);
      },
      writeShow: (show) => {
        shown.push(show);
      },
    },
  };
}

describe('runCommand', () => {
  it('off → writeEnabled(false) が 1 回呼ばれ、off の行が返る', () => {
    const { port, written, shown } = fakePort();
    const lines = runCommand(port, parseCommand('off'), 100);
    expect(written).toEqual([false]);
    expect(shown).toEqual([]);
    expect(lines).toEqual(['thinking-scrub: off']);
  });

  it('on → writeEnabled(true) が 1 回呼ばれ、on の行が返る', () => {
    const { port, written, shown } = fakePort();
    const lines = runCommand(port, parseCommand('on'), 100);
    expect(written).toEqual([true]);
    expect(shown).toEqual([]);
    expect(lines).toEqual(['thinking-scrub: on']);
  });

  it('show → writeShow(true) が 1 回、writeEnabled は呼ばれず、show の行が返る', () => {
    const { port, written, shown } = fakePort();
    const lines = runCommand(port, parseCommand('show'), 100);
    expect(shown).toEqual([true]);
    expect(written).toEqual([]);
    expect(lines).toEqual(['thinking-scrub: show']);
  });

  it('hide → writeShow(false) が 1 回、writeEnabled は呼ばれず、hide の行が返る', () => {
    const { port, written, shown } = fakePort();
    const lines = runCommand(port, parseCommand('hide'), 100);
    expect(shown).toEqual([false]);
    expect(written).toEqual([]);
    expect(lines).toEqual(['thinking-scrub: hide']);
  });

  it('空文字と空白だけ → どちらも呼ばれず、状態の行が返る', () => {
    for (const raw of ['', '   ']) {
      const { port, written, shown } = fakePort();
      const lines = runCommand(port, parseCommand(raw), 100);
      expect(written).toEqual([]);
      expect(shown).toEqual([]);
      expect(lines.join('\n')).toContain('thinking-scrub:');
      expect(lines.join('\n')).toContain('removed:');
    }
  });

  it('foo → どちらも呼ばれず、使い方の行が 1 行返る', () => {
    const { port, written, shown } = fakePort();
    const lines = runCommand(port, parseCommand('foo'), 100);
    expect(written).toEqual([]);
    expect(shown).toEqual([]);
    expect(lines).toHaveLength(1);
    expect(lines.at(0)).toContain('usage');
  });

  it('" off " → set で偽', () => {
    const command = parseCommand(' off ');
    expect(command).toEqual({ kind: 'set', enabled: false });
  });

  it('ON → set で真', () => {
    expect(parseCommand('ON')).toEqual({ kind: 'set', enabled: true });
  });

  it('SHOW → display で真', () => {
    expect(parseCommand('SHOW')).toEqual({ kind: 'display', show: true });
  });

  it('lastAt が null の状態 → 「まだ無い」の行', () => {
    const { port } = fakePort({ status: { removed: 0, lastAt: null, failures: 0 } });
    const lines = runCommand(port, parseCommand(''), 100);
    expect(lines.join('\n')).toContain('まだ無い');
  });

  it('lastAt が数値の状態 → その時刻の行', () => {
    const { port } = fakePort({ status: { removed: 2, lastAt: 456, failures: 0 } });
    const lines = runCommand(port, parseCommand(''), 100);
    expect(lines.join('\n')).toContain('456');
    expect(lines.join('\n')).toContain('removed: 2');
  });

  it('settings が enabled:false のときの status → off と回数と時刻の行', () => {
    const { port, written, shown } = fakePort({
      settings: { kind: 'ok', settings: { enabled: false, show: true } },
      status: { removed: 3, lastAt: 200, failures: 0 },
    });
    const lines = runCommand(port, parseCommand(''), 100);
    expect(written).toEqual([]);
    expect(shown).toEqual([]);
    expect(lines).toEqual(['thinking-scrub: off', 'show: on', 'removed: 3', 'last: 200']);
  });

  it('settings が show:false のときの status → 行に show: off が入る', () => {
    const { port } = fakePort({
      settings: { kind: 'ok', settings: { enabled: true, show: false } },
      status: { removed: 1, lastAt: null, failures: 0 },
    });
    const lines = runCommand(port, parseCommand(''), 100);
    expect(lines.join('\n')).toContain('show: off');
  });

  it('settings が broken のときの status → 壊れている旨と既定で動いている旨の行', () => {
    const { port, written, shown } = fakePort({
      settings: { kind: 'broken', reason: 'not JSON' },
      status: { removed: 1, lastAt: null, failures: 0 },
    });
    const lines = runCommand(port, parseCommand(''), 100);
    expect(written).toEqual([]);
    expect(shown).toEqual([]);
    expect(lines.join('\n')).toContain('broken');
    expect(lines.join('\n')).toContain('defaults');
  });

  it('settings が broken のときの off → writeEnabled(false) が呼ばれ、off の行が返る', () => {
    const { port, written, shown } = fakePort({
      settings: { kind: 'broken', reason: 'not JSON' },
    });
    const lines = runCommand(port, parseCommand('off'), 100);
    expect(written).toEqual([false]);
    expect(shown).toEqual([]);
    expect(lines).toEqual(['thinking-scrub: off']);
  });
});
