/**
 * intent-router の入口。設定を読み、run と flags を持ち、route → judge → command の順に登録する。
 *
 * 設定はセッションの木から読む（`<cwd>/.pi/extensions/intent-router/settings.json`）。
 * 壊れていれば投げる（黙って既定で走らない）。`logs/` の置き場はここで決める。
 */

import { isAbsolute, join } from 'node:path';
import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { createAsk, type Ask } from './ask/ask.ts';
import { registerCommand } from './command/intent.ts';
import { registerJudge } from './judge/hook.ts';
import { registerRoute } from './route/hook.ts';
import { append, prune, type LogRecord } from './record/recent.ts';
import { defaultSettings, type Settings } from './settings/schema.ts';
import { readSettings } from './settings/read.ts';
import { idleRun, type FlagsPort, type Run, type RunPort } from './state/run.ts';

// index.ts が持つ物。入口はこれだけを公開する
export interface Wiring {
  readonly settings: Settings;
  readonly run: Run;
  readonly flags: { readonly enabled: boolean };
}

type Registry = ExtensionContext['modelRegistry'];

interface AskCell {
  readonly ask: Ask;
  readonly hold: (ctx: ExtensionContext) => void;
}

// pi の classifier はイベントの ctx からしか引けない。初回のイベントで作り、使い回す
function createLazyAsk(settings: Settings): AskCell {
  let registry: Registry | undefined;
  let notifier: ((message: string) => void) | undefined;
  let ask: Ask | undefined;
  return {
    ask: (request) => {
      if (registry === undefined) {
        return Promise.resolve({
          kind: 'failed',
          tried: [],
          reason: 'no model registry',
          latencyMs: 0,
        });
      }
      if (ask === undefined) {
        const current = registry;
        ask = createAsk({
          registry: current,
          settings,
          notify: (message) => {
            notifier?.(message);
          },
        });
      }
      return ask(request);
    },
    hold: (ctx) => {
      registry = ctx.modelRegistry;
      notifier = (message: string): void => {
        ctx.ui.notify(message);
      };
    },
  };
}

interface StateCell {
  readonly run: RunPort;
  readonly flags: FlagsPort;
  readonly snapshot: () => { readonly run: Run; readonly flags: { readonly enabled: boolean } };
}

function createState(): StateCell {
  let run: Run = idleRun();
  let flags = { enabled: true };
  return {
    run: {
      get: () => run,
      set: (next) => {
        run = next;
      },
    },
    flags: {
      get: () => flags,
      set: (next) => {
        flags = next;
      },
    },
    snapshot: () => ({ run, flags }),
  };
}

export function register(pi: ExtensionAPI, options?: { readonly cwd?: string }): Wiring {
  const cwd = options?.cwd ?? process.cwd();
  const settings = readSettings(join(cwd, '.pi/extensions/intent-router'), defaultSettings());
  const logDir = isAbsolute(settings.log.dir) ? settings.log.dir : join(cwd, settings.log.dir);
  const state = createState();
  const cell = createLazyAsk(settings);
  const log = (record: LogRecord): void => {
    append(record, logDir);
  };

  registerRoute(
    {
      on: (event, handler) => {
        pi.on(event, (ev, ctx) => {
          cell.hold(ctx);
          return handler({ prompt: ev.prompt, images: ev.images }, { cwd: ctx.cwd });
        });
      },
    },
    { settings, ask: cell.ask, run: state.run, flags: state.flags, log },
  );
  registerJudge(
    {
      on: (event, handler) => {
        pi.on(event, (ev, ctx) => {
          cell.hold(ctx);
          const content = 'content' in ev.message ? ev.message.content : '';
          return handler(
            { turnIndex: ev.turnIndex, message: { content }, toolResults: ev.toolResults },
            { cwd: ctx.cwd },
          ).then((result) => {
            if (result === undefined) {
              return undefined;
            }
            return { entries: [...result.entries] };
          });
        });
      },
    },
    { settings, ask: cell.ask, run: state.run, flags: state.flags, log },
  );
  pi.on('session_start', () => {
    prune(logDir, settings.log.keepDays, new Date());
  });
  registerCommand(
    {
      registerCommand: (name, opts) => {
        pi.registerCommand(name, {
          description: opts.description,
          handler: (args, ctx) => {
            opts.handler(args, { ui: ctx.ui });
            return Promise.resolve();
          },
        });
      },
    },
    { flags: state.flags, run: state.run, log },
  );

  return { settings, ...state.snapshot() };
}

export default function (pi: ExtensionAPI): void {
  register(pi);
}
