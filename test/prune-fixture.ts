/**
 * context-prune テストの工場。
 *
 * 設定の JSON、`custom` のエントリ、prune の記録を作る。
 * 期待値は `defaultSettings()` と工場に渡した値から取る。
 * pi の `usage` とメッセージは `test/pi-fixture.ts` から読む。同じ物を作らない。
 * 印の文（`markerText`）はここに集める。
 *
 * 値と文字列を組み立てるだけで、プロセスも FS も開かない。
 * テストの外から読まれても、何も起きずに止まらない。
 */
import { markerText } from '../.pi/extensions/context-prune/apply/drafts.ts';
import {
  CUSTOM_TYPE,
  type Drop,
  type PrunePass,
} from '../.pi/extensions/context-prune/entry/data.ts';
import type { Failure, Status } from '../.pi/extensions/context-prune/command/prune.ts';
import { defaultSettings, type Settings } from '../.pi/extensions/context-prune/settings/schema.ts';
import type { SessionEntry } from '@earendil-works/pi-coding-agent';

/** 設定の文書を JSON にする */
export function settingsJson(document: Record<string, unknown>): string {
  return JSON.stringify(document);
}

/** 既定に上書きを重ねた設定を作る */
export function pruneSettings(overrides: Partial<Settings> = {}): Settings {
  const base = defaultSettings();
  const { classifier, ...rest } = overrides;
  return {
    ...base,
    ...rest,
    classifier: {
      ...base.classifier,
      ...classifier,
    },
  };
}

/** 落とし物の 1 件を作る */
export function pruneDrop(overrides: Partial<Drop> = {}): Drop {
  return {
    id: 'e1',
    chars: 10,
    ...overrides,
  };
}

/** prune の記録を作る。`dropped` から文字数とトークンを見積もる */
export function prunePass(overrides: Partial<PrunePass> = {}): PrunePass {
  const drops = overrides.dropped ?? [
    { id: 'e1', chars: 1000 },
    { id: 'e2', chars: 234 },
  ];
  let chars = 0;
  let tokens = 0;
  for (const drop of drops) {
    chars += drop.chars;
    tokens += Math.ceil(drop.chars / 4);
  }
  return {
    at: 1000,
    tokensBefore: 60000,
    summary: 'テストの要約',
    kept: 1,
    latencyMs: 1200,
    usage: undefined,
    ...overrides,
    dropped: drops,
    droppedChars: overrides.droppedChars ?? chars,
    droppedTokens: overrides.droppedTokens ?? tokens,
  };
}

/** 状態を作る */
export function pruneStatus(overrides: Partial<Status> = {}): Status {
  return {
    running: false,
    failures: 0,
    lastPass: undefined,
    lastFailure: undefined,
    ...overrides,
  };
}

/** 失敗の記録を作る */
export function pruneFailure(overrides: Partial<Failure> = {}): Failure {
  return {
    at: 1000,
    tokens: 60000,
    reason: 'classifier boom',
    ...overrides,
  };
}

/** パスの `custom` エントリを作る */
export function customPassEntry(pass: PrunePass, id = 'e-pass'): SessionEntry {
  return {
    type: 'custom',
    id,
    parentId: null,
    timestamp: new Date(1).toISOString(),
    customType: CUSTOM_TYPE,
    data: { ...pass, dropped: [...pass.dropped] },
  };
}

/** 印の雛形。`defaultSettings().marker` と同じ */
export function pruneTemplate(): string {
  return defaultSettings().marker;
}

/** 印の文。`markerText` の呼び出しはここに集める */
export function pruneMarker(chars: number, template?: string): string {
  return markerText(chars, template ?? defaultSettings().marker);
}
