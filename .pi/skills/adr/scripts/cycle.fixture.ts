import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tempDir } from '../../../../test/temp-dir.ts';
import { adrSkeleton } from './adr.mjs';
import { affectedEntrySkeleton } from './affected.mjs';
import { cycleDirName } from './cycle.mjs';

export type CycleSpec = {
  readonly name?: string;
  readonly adr?: string | null;
  readonly close?: string | null;
  readonly affected?: readonly { readonly nn: number; readonly title?: string }[];
};

export function cycleTree(cycles: readonly CycleSpec[] = [{}]): {
  readonly root: string;
  readonly cyclesDir: string;
  readonly dirs: readonly string[];
} {
  const root = tempDir();
  const cyclesDir = join(root, 'cycles');
  const dirs: string[] = [];
  for (const spec of cycles) {
    const name = spec.name ?? cycleDirName(15, '261010', 'main');
    const dir = join(cyclesDir, name);
    mkdirSync(dir, { recursive: true });
    const adr = spec.adr === undefined ? adrSkeleton(15) : spec.adr;
    if (adr !== null) {
      writeFileSync(join(dir, 'adr.md'), adr);
    }
    if (spec.close !== undefined && spec.close !== null) {
      writeFileSync(join(dir, 'close.md'), spec.close);
    }
    if (spec.affected !== undefined) {
      mkdirSync(join(dir, 'affected'), { recursive: true });
      for (const entry of spec.affected) {
        writeFileSync(
          join(dir, 'affected', `${String(entry.nn).padStart(2, '0')}.md`),
          affectedEntrySkeleton(entry.nn, entry.title),
        );
      }
    }
    dirs.push(dir);
  }
  return { root, cyclesDir, dirs };
}
