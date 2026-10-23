import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { dayFile, dayName, oldFiles, placeFor, projectKey, windowFiles } from './place.ts';

// 置き場を偽物にするテストは、`tempDir()` と `placeFor` で作る。実物の /tmp/pi-consult を触らない。

describe('projectKey', () => {
  it('別の道で同じ名前の repo → 違う値になる（置き場が分かれる）', () => {
    const left = join(tempDir(), 'repo');
    const right = join(tempDir(), 'repo');
    expect(projectKey(left)).not.toBe(projectKey(right));
  });
});

describe('dayName', () => {
  it('ローカルの日で組む（この機械は JST）', () => {
    // 2026-10-09T15:30:00Z は JST で 2026-10-10。UTC で組むと 2026-10-09 になる
    expect(dayName(new Date('2026-10-09T15:30:00Z'))).toBe('2026-10-10');
  });
});

describe('windowFiles', () => {
  it('置き場が無い → []', () => {
    const place = placeFor(tempDir(), tempDir());
    expect(windowFiles(place, new Date(2026, 9, 10), 2)).toEqual([]);
  });

  it('今日と昨日の 2 件を新しい順に返し、3 日前は返さない', () => {
    const place = placeFor(tempDir(), tempDir());
    mkdirSync(place.dir, { recursive: true });
    for (const name of ['2026-10-10.jsonl', '2026-10-09.jsonl', '2026-10-07.jsonl']) {
      writeFileSync(join(place.dir, name), '{}\n');
    }
    expect(windowFiles(place, new Date(2026, 9, 10), 2)).toEqual([
      join(place.dir, '2026-10-10.jsonl'),
      join(place.dir, '2026-10-09.jsonl'),
    ]);
  });

  it('delivered.json を置いても拾わない', () => {
    const place = placeFor(tempDir(), tempDir());
    mkdirSync(place.dir, { recursive: true });
    writeFileSync(join(place.dir, 'delivered.json'), '{}\n');
    writeFileSync(join(place.dir, '2026-10-10.jsonl'), '{}\n');
    expect(windowFiles(place, new Date(2026, 9, 10), 2)).toEqual([
      join(place.dir, '2026-10-10.jsonl'),
    ]);
  });
});

describe('dayFile', () => {
  it('その日のファイルを指す', () => {
    const place = placeFor(tempDir(), tempDir());
    expect(dayFile(place, new Date(2026, 9, 10))).toBe(join(place.dir, '2026-10-10.jsonl'));
  });
});

describe('oldFiles', () => {
  it('30 日より古いだけを返し、ちょうど 30 日前は残す', () => {
    const place = placeFor(tempDir(), tempDir());
    mkdirSync(place.dir, { recursive: true });
    for (const name of ['2026-09-09.jsonl', '2026-09-10.jsonl', '2026-10-10.jsonl']) {
      writeFileSync(join(place.dir, name), '{}\n');
    }
    // 2026-10-10 から 30 日前は 2026-09-10。含む側は残す
    expect(oldFiles(place, new Date(2026, 9, 10), 30)).toEqual([
      join(place.dir, '2026-09-09.jsonl'),
    ]);
  });

  it('置き場が無い → []', () => {
    const place = placeFor(tempDir(), tempDir());
    expect(oldFiles(place, new Date(2026, 9, 10), 30)).toEqual([]);
  });
});
