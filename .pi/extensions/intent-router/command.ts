/**
 * `/intent` でセッション中だけ切る。settings は書き換えない。
 *
 * `off` は `run` を捨て（arm 済みを捨てる）、`hook: 'command'` のログを1行残す。
 */

import type { LogRecord } from './log.ts';
import { idleRun, type FlagsPort, type RunPort } from './state.ts';

export interface CommandCtx {
  readonly ui: { readonly notify: (message: string) => void };
}

export interface CommandPiPort {
  registerCommand(
    name: string,
    options: {
      readonly description: string;
      readonly handler: (args: string, ctx: CommandCtx) => void;
    },
  ): void;
}

export interface CommandDeps {
  readonly flags: FlagsPort;
  readonly run: RunPort;
  readonly log: (record: LogRecord) => void;
}

/** 引数を解釈し、次の flag と画面に出す1行を返す */
export function intentMessage(
  args: string,
  enabled: boolean,
): { readonly next: { readonly enabled: boolean }; readonly message: string } {
  const trimmed = args.trim();
  if (trimmed === 'off') {
    return { next: { enabled: false }, message: 'intent-router: off' };
  }
  if (trimmed === 'on') {
    return { next: { enabled: true }, message: 'intent-router: on' };
  }
  if (trimmed === '') {
    return { next: { enabled }, message: enabled ? 'intent-router: on' : 'intent-router: off' };
  }
  return { next: { enabled }, message: 'intent-router: on|off' };
}

export function registerCommand(pi: CommandPiPort, deps: CommandDeps): void {
  pi.registerCommand('intent', {
    description: 'Turn intent-router on or off for this session (usage: /intent on|off)',
    handler: (args, ctx) => {
      const { next, message } = intentMessage(args, deps.flags.get().enabled);
      deps.flags.set(next);
      if (!next.enabled) {
        deps.run.set(idleRun());
      }
      deps.log({ at: new Date().toISOString(), hook: 'command', enabled: next.enabled });
      ctx.ui.notify(message);
    },
  });
}
