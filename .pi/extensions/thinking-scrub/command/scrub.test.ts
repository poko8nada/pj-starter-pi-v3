import { describe, expect, it } from 'vitest';
import {
  SCRUB_BROKEN_MARK,
  SCRUB_DEFAULTS_MARK,
  SCRUB_HIDE_LINE,
  SCRUB_LAST_NONE,
  SCRUB_OFF_LINE,
  SCRUB_ON_LINE,
  SCRUB_PREFIX,
  SCRUB_REMOVED_LABEL,
  SCRUB_SHOW_LINE,
  SCRUB_SHOW_OFF,
  SCRUB_SHOW_ON,
  SCRUB_USAGE_LINE,
} from '../../../../test/scrub-fixture.ts';
import { parseCommand, runCommand, type CommandPort } from './scrub.ts';
import type { SettingsRead } from '../settings/schema.ts';
import type { Status } from '../state/cell.ts';

// CommandPort は記録する偽物で渡す。出力の文は工場の印と回数から組む。

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
    expect(lines).toEqual([SCRUB_OFF_LINE]);
  });

  it('on → writeEnabled(true) が 1 回呼ばれ、on の行が返る', () => {
    const { port, written, shown } = fakePort();
    const lines = runCommand(port, parseCommand('on'), 100);
    expect(written).toEqual([true]);
    expect(shown).toEqual([]);
    expect(lines).toEqual([SCRUB_ON_LINE]);
  });

  it('show → writeShow(true) が 1 回、writeEnabled は呼ばれず、show の行が返る', () => {
    const { port, written, shown } = fakePort();
    const lines = runCommand(port, parseCommand('show'), 100);
    expect(shown).toEqual([true]);
    expect(written).toEqual([]);
    expect(lines).toEqual([SCRUB_SHOW_LINE]);
  });

  it('hide → writeShow(false) が 1 回、writeEnabled は呼ばれず、hide の行が返る', () => {
    const { port, written, shown } = fakePort();
    const lines = runCommand(port, parseCommand('hide'), 100);
    expect(shown).toEqual([false]);
    expect(written).toEqual([]);
    expect(lines).toEqual([SCRUB_HIDE_LINE]);
  });

  it('空文字と空白だけ → どちらも呼ばれず、状態の行が返る', () => {
    for (const raw of ['', '   ']) {
      const { port, written, shown } = fakePort();
      const lines = runCommand(port, parseCommand(raw), 100);
      expect(written).toEqual([]);
      expect(shown).toEqual([]);
      expect(lines.join('\n')).toContain(SCRUB_PREFIX);
      expect(lines.join('\n')).toContain(SCRUB_REMOVED_LABEL);
    }
  });

  it('foo → どちらも呼ばれず、使い方の 1 行が返る', () => {
    const { port, written, shown } = fakePort();
    const lines = runCommand(port, parseCommand('foo'), 100);
    expect(written).toEqual([]);
    expect(shown).toEqual([]);
    expect(lines).toEqual([SCRUB_USAGE_LINE]);
  });

  it('" off " → set で偽、ON → set で真、SHOW → display で真', () => {
    expect(parseCommand(' off ')).toEqual({ kind: 'set', enabled: false });
    expect(parseCommand('ON')).toEqual({ kind: 'set', enabled: true });
    expect(parseCommand('SHOW')).toEqual({ kind: 'display', show: true });
  });

  it('lastAt が null の状態 → まだ無い旨の行', () => {
    const { port } = fakePort({ status: { removed: 0, lastAt: null, failures: 0 } });
    const lines = runCommand(port, parseCommand(''), 100);
    expect(lines.join('\n')).toContain(SCRUB_LAST_NONE);
  });

  it('lastAt が数値の状態 → その時刻の行', () => {
    const lastAt = 456;
    const removed = 2;
    const { port } = fakePort({ status: { removed, lastAt, failures: 0 } });
    const lines = runCommand(port, parseCommand(''), 100);
    expect(lines.join('\n')).toContain(String(lastAt));
    expect(lines.join('\n')).toContain(`${SCRUB_REMOVED_LABEL} ${removed}`);
  });

  it('enabled:false の status → off と回数と時刻の行', () => {
    const removed = 3;
    const lastAt = 200;
    const { port, written, shown } = fakePort({
      settings: { kind: 'ok', settings: { enabled: false, show: true } },
      status: { removed, lastAt, failures: 0 },
    });
    const lines = runCommand(port, parseCommand(''), 100);
    expect(written).toEqual([]);
    expect(shown).toEqual([]);
    expect(lines).toEqual([
      SCRUB_OFF_LINE,
      SCRUB_SHOW_ON,
      `${SCRUB_REMOVED_LABEL} ${removed}`,
      `last: ${lastAt}`,
    ]);
  });

  it('show:false の status → 行に off の印が入る', () => {
    const { port } = fakePort({
      settings: { kind: 'ok', settings: { enabled: true, show: false } },
      status: { removed: 1, lastAt: null, failures: 0 },
    });
    const lines = runCommand(port, parseCommand(''), 100);
    expect(lines.join('\n')).toContain(SCRUB_SHOW_OFF);
  });

  it('broken の status → 壊れている旨と既定で動いている旨', () => {
    const { port, written, shown } = fakePort({
      settings: { kind: 'broken', reason: 'not JSON' },
      status: { removed: 1, lastAt: null, failures: 0 },
    });
    const lines = runCommand(port, parseCommand(''), 100);
    expect(written).toEqual([]);
    expect(shown).toEqual([]);
    expect(lines.join('\n')).toContain(SCRUB_BROKEN_MARK);
    expect(lines.join('\n')).toContain(SCRUB_DEFAULTS_MARK);
  });

  it('broken の off → writeEnabled(false) が 1 回、off の行が返る', () => {
    const { port, written, shown } = fakePort({
      settings: { kind: 'broken', reason: 'not JSON' },
    });
    const lines = runCommand(port, parseCommand('off'), 100);
    expect(written).toEqual([false]);
    expect(shown).toEqual([]);
    expect(lines).toEqual([SCRUB_OFF_LINE]);
  });
});
