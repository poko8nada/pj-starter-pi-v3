import { EventEmitter } from 'node:events';
import type { Spawn } from '../.pi/extensions/consult/run/run.ts';

/** 偽の子プロセス。`runPi` が触る欄だけを持つ */
export class FakeChild extends EventEmitter {
  readonly stdout = new EventEmitter();
  readonly stderr = new EventEmitter();
  readonly stdin = { end: (): void => {} };
  readonly pid = 123;
  killed = false;
  kill(): void {
    this.killed = true;
  }
}

/** 偽の `spawn` と、それが作った子の並び */
export function createFakeSpawn(): {
  readonly spawn: Spawn;
  readonly children: FakeChild[];
} {
  const children: FakeChild[] = [];
  const spawn: Spawn = (_command, _args, _options) => {
    const child = new FakeChild();
    children.push(child);
    return child;
  };
  return { spawn, children };
}
