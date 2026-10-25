/**
 * consult のテストが使う工場。
 *
 * 何をする物か
 * - `types.json` の 1 つの type、サブエージェントの依頼、記録の 1 行を組み立てる。
 * - 値と文字列を組み立てるだけで、プロセスも FS も開かない。
 * - テストの外から読まれても、何も起きずに止まらない（副作用を持たない）。
 *
 * どう呼ぶか
 * - 期待値は工場に渡した値から取る。断言に数や文を直書きしない。
 */

import type { TypePolicy } from '../.pi/extensions/consult/policy/types.ts';
import type { ConsultOptions } from '../.pi/extensions/consult/sub/spec.ts';
import type { RunRecord } from '../.pi/extensions/consult/run/log.ts';

/** 最小の正しい type。1 箇所だけ壊すのに使う */
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

/** type の一覧を `types.json` の本文にする。空なら既定の 1 つ */
export function aTypesText(...policies: unknown[]): string {
  const types = policies.length > 0 ? policies : [aTypePolicy()];
  return JSON.stringify({ types });
}

/** サブエージェントへの依頼。argv の期待はここに渡した値から組む */
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

/** 記録の 1 行。期待する番号や文はここに渡した値から組む */
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
