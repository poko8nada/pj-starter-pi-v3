/**
 * close テスト用の一時ツリー。
 *
 * テストの外から呼ばれても、一時ツリーを作って返し、止まらない。
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { betaFile, betaPlan, normalPlan, planFile } from './collect.fixture.ts';
import { tempDir } from '../../../../test/temp-dir.ts';

export type CloseCycleSpec = {
  readonly plans?: readonly { readonly file: string; readonly doc: string }[];
  readonly close?: string | null;
};

const defaultClose = '# Close 001\n\n## Collected\n\nなし\n\n## Triage\n\nなし\n';

/** 一時ツリーを作り、サイクルの dir を返す。 */
export function cycleTree(spec?: CloseCycleSpec): string {
  const root = tempDir();
  const cycle = join(root, '261024-001-dev');
  const planDir = join(cycle, 'plan');
  mkdirSync(planDir, { recursive: true });
  const plans = spec?.plans ?? [
    { file: planFile, doc: normalPlan },
    { file: betaFile, doc: betaPlan },
  ];
  for (const plan of plans) {
    writeFileSync(join(planDir, plan.file), plan.doc);
  }
  if (spec?.close === null) {
    return cycle;
  }
  writeFileSync(join(cycle, 'close.md'), spec?.close ?? defaultClose);
  return cycle;
}
