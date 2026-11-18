import { EventEmitter } from 'node:events';

/** 偽の子プロセス。ストリームと終了の合図だけを持つ */
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
  readonly spawn: (command: string, args: readonly string[], options: unknown) => FakeChild;
  readonly children: FakeChild[];
} {
  const children: FakeChild[] = [];
  const spawn = (_command: string, _args: readonly string[], _options: unknown): FakeChild => {
    const child = new FakeChild();
    children.push(child);
    return child;
  };
  return { spawn, children };
}
