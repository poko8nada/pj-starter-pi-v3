/**
 * bash の git commit で鳴る音だけを、差し替えた鳴らす関数で確かめる。
 *
 * afplay は起動しない。`setPlayer` に記録するだけの関数を渡し、実際に鳴る所をテストから外す。
 * イベントの判定は `handleToolExecutionEnd` に直接渡し、pi と ctx は必要な口だけの偽物で足りる。
 */

import type { ToolExecutionEndEvent } from '@earendil-works/pi-coding-agent';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  handleToolExecutionEnd,
  parseConfig,
  setPlayer,
  type CtxPort,
  type PiPort,
} from './index.ts';

const pi: PiPort = { exec: async () => undefined };
const ctx: CtxPort = { hasUI: true };
const defaultConfig = parseConfig({});

function commitEvent(overrides: Partial<ToolExecutionEndEvent> = {}): ToolExecutionEndEvent {
  return {
    type: 'tool_execution_end',
    toolCallId: 't1',
    toolName: 'bash',
    result: {
      content: [{ type: 'text', text: '[main abc1234] Add feature\n 1 file changed' }],
    },
    isError: false,
    ...overrides,
  };
}

describe('sound-notify.commit', () => {
  const played: string[] = [];
  let restorePlayer: () => void;

  beforeEach(() => {
    played.length = 0;
    restorePlayer = setPlayer(async (_pi, soundName) => {
      played.push(soundName);
    });
  });

  afterEach(() => {
    restorePlayer();
  });

  function run(event: ToolExecutionEndEvent, config = defaultConfig): void {
    handleToolExecutionEnd(pi, ctx, event, config);
  }

  it('bash の結果にコミットの形 → commit の音が 1 回鳴る', () => {
    run(commitEvent());
    expect(played).toEqual(['Pop']);
  });

  it('bash の結果が普通の出力 → 鳴らない', () => {
    run(
      commitEvent({
        result: { content: [{ type: 'text', text: 'ok\n3 passed' }] },
      }),
    );
    expect(played).toEqual([]);
  });

  it('toolName が bash 以外 → 鳴らない', () => {
    run(commitEvent({ toolName: 'read' }));
    expect(played).toEqual([]);
  });

  it('isError が真 → 鳴らない', () => {
    run(commitEvent({ isError: true }));
    expect(played).toEqual([]);
  });

  it('config.json の sounds.commit を別名にする → その名前で鳴る', () => {
    run(commitEvent(), parseConfig({ sounds: { commit: 'Basso' } }));
    expect(played).toEqual(['Basso']);
  });
});
