/**
 * intent-router の入口。設定を読み、run と flags を持ち、route → judge → command の順に登録する。
 *
 * 設定はセッションの木から読む（`<cwd>/.pi/extensions/intent-router/settings.json`）。
 * 壊れていれば投げる（黙って既定で走らない）。ask のたびにファイルを読み直す。
 * `logs/` の置き場はここで決める。
 */

import { isAbsolute, join } from 'node:path';
import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { createAsk, createBatchAsk, type Ask, type BatchAsk } from './ask/ask.ts';
import { registerCommand } from './command/intent.ts';
import { registerJudge } from './judge/hook.ts';
import { registerRoute } from './route/hook.ts';
import { append, prune, type LogRecord } from './record/recent.ts';
import { type Settings } from './settings/schema.ts';
import { readSettings } from './settings/read.ts';
import { idleRun, type FlagsPort, type Run, type RunPort } from './state/run.ts';
import { lastAssistantText } from './state/payload.ts';

// index.ts が持つ物。入口はこれだけを公開する
export interface Wiring {
  readonly settings: Settings;
  readonly run: Run;
  readonly flags: { readonly enabled: boolean };
}

type Registry = ExtensionContext['modelRegistry'];

interface AskCell {
  readonly ask: Ask;
  readonly askBatch: BatchAsk;
  readonly hold: (ctx: ExtensionContext) => void;
}

// pi の classifier はイベントの ctx からしか引けない。初回のイベントで作り、使い回す。
// 設定は ask のたびに読み直す。有料通知はセッションで1回だけ出す。
function createLazyAsk(settingsDir: string): AskCell {
  let registry: Registry | undefined;
  let notifier: ((message: string) => void) | undefined;
  let paidNotified = false;
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
      const fresh = readSettings(settingsDir);
      const current = registry;
      const ask = createAsk({
        registry: current,
        settings: fresh,
        notify: (message) => {
          if (!paidNotified) {
            paidNotified = true;
            notifier?.(message);
          }
        },
      });
      return ask(request);
    },
    askBatch: (request) => {
      if (registry === undefined) {
        return Promise.resolve({
          kind: 'failed',
          tried: [],
          reason: 'no model registry',
          latencyMs: 0,
        });
      }
      const fresh = readSettings(settingsDir);
      const current = registry;
      const askBatch = createBatchAsk({
        registry: current,
        settings: fresh,
        notify: (message) => {
          if (!paidNotified) {
            paidNotified = true;
            notifier?.(message);
          }
        },
      });
      return askBatch(request);
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

function wiringFor(cwd: string, settingsDir: string) {
  const initial = readSettings(settingsDir);
  let current: Settings = initial;
  const refresh = (): Settings => {
    current = readSettings(settingsDir);
    return current;
  };
  const logDirOf = (settings: Settings): string =>
    isAbsolute(settings.log.dir) ? settings.log.dir : join(cwd, settings.log.dir);
  const state = createState();
  const cell = createLazyAsk(settingsDir);
  const log = (record: LogRecord): void => {
    append(record, logDirOf(current));
  };
  const routeDeps = {
    get settings(): Settings {
      return current;
    },
    ask: cell.ask,
    run: state.run,
    flags: state.flags,
    log,
  };
  const judgeDeps = {
    get settings(): Settings {
      return current;
    },
    askBatch: cell.askBatch,
    run: state.run,
    flags: state.flags,
    log,
  };
  return {
    initial,
    current: () => current,
    refresh,
    logDirOf,
    state,
    cell,
    log,
    routeDeps,
    judgeDeps,
  };
}

function readAgentPrev(ctx: ExtensionContext, maxChars: number): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- sessionManager の拡張口を読む
    const manager = ctx.sessionManager as unknown as {
      buildContextEntries?: () => unknown;
    };
    const entries = manager.buildContextEntries?.();
    if (!Array.isArray(entries)) {
      return '';
    }
    return lastAssistantText(entries, maxChars);
  } catch {
    return '';
  }
}

export function register(pi: ExtensionAPI, options?: { readonly cwd?: string }): Wiring {
  const cwd = options?.cwd ?? process.cwd();
  const settingsDir = join(cwd, '.pi/extensions/intent-router');
  const wired = wiringFor(cwd, settingsDir);
  const { initial, refresh, logDirOf, state, cell, log, routeDeps, judgeDeps } = wired;

  registerRoute(
    {
      on: (event, handler) => {
        pi.on(event, (ev, ctx) => {
          cell.hold(ctx);
          const settings = refresh();
          const agentPrev = readAgentPrev(ctx, settings.state.textChars);
          return handler({ prompt: ev.prompt, images: ev.images }, { cwd: ctx.cwd, agentPrev });
        });
      },
    },
    routeDeps,
  );
  registerJudge(
    {
      on: (event, handler) => {
        pi.on(event, (ev, ctx) => {
          cell.hold(ctx);
          refresh();
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
    judgeDeps,
  );
  pi.on('session_start', () => {
    const settings = refresh();
    prune(logDirOf(settings), settings.log.keepDays, new Date());
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

  return { settings: initial, ...state.snapshot() };
}

export default function (pi: ExtensionAPI): void {
  register(pi);
}
