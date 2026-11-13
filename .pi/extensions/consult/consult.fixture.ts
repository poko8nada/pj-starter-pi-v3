/**
 * consult のテストで使うファクトリを集める。
 *
 * 何をするものか
 * - `types.json` の 1 つの type、サブエージェントの依頼、記録の 1 行を組み立てる。
 * - 値と文字列を組み立てる。`aPlace()` は `tempDir()` で一時ディレクトリを作り、後始末は `temp-dir.ts` がする。`aAt()` は毎回新しい Date を返す。
 * - テストの外から読まれても、何も起きずに止まらない（副作用を持たない）。
 *
 * どう呼ぶか
 * - 期待値はファクトリに渡した値から取る。断言に数や文を直書きしない。
 */

import type { TypePolicy } from './policy/types.ts';
import type { ConsultOptions } from './sub/spec.ts';
import { placeFor, type Place } from './run/place.ts';
import { tempDir } from '../../../test/temp-dir.ts';
import type { RunRecord } from './run/log.ts';
import type { WidgetUI } from './view/widget.ts';

/** 最小の正しい type を作る。1 箇所だけ壊すときに使う */
export function aTypePolicy(overrides: Partial<TypePolicy> = {}): TypePolicy {
  const { limits, ...rest } = overrides;
  return {
    name: 'review',
    models: [],
    tools: ['read'],
    isolated: false,
    paths: [],
    bash: [],
    continueByDefault: false,
    limits: { turns: 20, output: 20000, ...limits },
    ...rest,
  };
}

/** type の一覧を `types.json` の本文にする。空なら既定の 1 つを返す */
export function aTypesText(...policies: unknown[]): string {
  const types = policies.length > 0 ? policies : [aTypePolicy()];
  return JSON.stringify({ types });
}

/** サブエージェントへの依頼を作る。argv の期待はここに渡した値から組む */
export function aConsultOptions(overrides: Partial<ConsultOptions> = {}): ConsultOptions {
  const policy = overrides.policy ?? aTypePolicy();
  return {
    type: policy.name,
    task: '調べる',
    policy,
    token: 'token-1',
    ...overrides,
  };
}

/** 記録の 1 行を作る。期待する番号や文はここに渡した値から組む */
export function aRunRecord(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    session: 'session-a',
    subagent: 'consult-1',
    role: 'review',
    pid: 1,
    started: 1000,
    ...overrides,
  };
}

/** 使い捨ての保存場所を作る。後始末は `temp-dir.ts` がする */
export function aPlace(): Place {
  return placeFor(tempDir(), tempDir());
}

/** 終わった記録の 1 行を作る */
export function aDoneRun(overrides: Partial<RunRecord> = {}): RunRecord {
  return aRunRecord({ ended: 2000, state: 'done', ...overrides });
}

/** 固定日時を毎回新しい Date で返す */
export function aAt(): Date {
  return new Date(2026, 9, 10, 12, 0);
}

/** `setWidget` の呼び出しを記録する ui。呼び出しは `calls` に順に残る */
export function aWidgetUI(): {
  readonly ui: WidgetUI;
  readonly calls: ReadonlyArray<{ readonly key: string; readonly content: unknown }>;
} {
  const calls: Array<{ key: string; content: unknown }> = [];
  const ui: WidgetUI = {
    setWidget: (key: string, content: unknown) => {
      calls.push({ key, content });
    },
  };
  return { ui, calls };
}
