import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { collectCycle, collectPlan } from './collect.mjs';

const plan = `# PLAN worktree-cleanup

## Notes

### Slice 1: 一覧がゴーストを出さない

- Findings:
- Unplanned:
- Commit: abc1234

### Slice 2: remove が片付ける

- Findings:
  - 未マージの枝の reason が索引とずれることがある
    - left: 索引の読み順は plan の外
- Unplanned:
  - なし
- Commit:

## Review

### Round 1

- Stale:
  - README.md の consult_worktree が消した物を返さないと読める
    - fixed: 表を直した
- Gaps:
  - tool/worktree.test.ts に busy のケースが無い
    - left: run 側の検査で覆っているため
- Unlisted: なし

## Acceptance

- Ran: plan の Verify 全部 + typecheck + test
- Findings:
  - 未マージの枝がある時に session が残る
    - fixed: session_start で握りつぶした
  - remove の後も session のファイルが残る
    - left: 次のサイクルで扱う
- Merge: def5678
`;

describe('collectPlan', () => {
  it('Notes の Findings を、スライス名と対応付きで抜く', () => {
    const items = collectPlan(plan);
    expect(items).toContainEqual({
      place: 'Slice 2 (remove が片付ける)',
      finding: '未マージの枝の reason が索引とずれることがある',
      handling: 'left: 索引の読み順は plan の外',
    });
  });

  it('穴の無いスライスは抜かない', () => {
    expect(collectPlan(plan).some((item) => item.place.startsWith('Slice 1'))).toBe(false);
  });

  it('Review は left: の指摘だけ抜く。fixed: は抜かない', () => {
    const items = collectPlan(plan);
    expect(items).toContainEqual({
      place: 'Review Round 1',
      finding: 'tool/worktree.test.ts に busy のケースが無い',
      handling: 'left: run 側の検査で覆っているため',
    });
    expect(items.some((item) => item.finding.includes('README.md'))).toBe(false);
  });

  it('Acceptance は left: だけ抜く。fixed: は閉じているので抜かない', () => {
    const items = collectPlan(plan);
    expect(items).toContainEqual({
      place: 'Acceptance',
      finding: 'remove の後も session のファイルが残る',
      handling: 'left: 次のサイクルで扱う',
    });
    expect(items.some((item) => item.finding.includes('session が残る'))).toBe(false);
  });

  it('`なし` に注記が続いても穴として拾わない', () => {
    const withNote = plan.replace(
      '- Unlisted: なし',
      '- Unlisted: なし — 名指ししていない変更は無い（現物と Files を突合した）',
    );
    expect(collectPlan(withNote).some((item) => item.finding.startsWith('なし'))).toBe(false);
  });

  it('残り物が無ければ空', () => {
    expect(collectPlan('# PLAN empty-plan\n\n## Notes\n\n### Slice 1: x\n\n- Findings:\n')).toEqual(
      [],
    );
  });
});

const write = (dir: string, file: string, body: string): void => {
  writeFileSync(join(dir, file), body);
};

describe('collectCycle', () => {
  it('plan ごとの見出しと通し番号を出し、設計の plan が先で ex- が後', () => {
    const dir = tmpDir();
    write(dir, 'worktree-cleanup.md', plan);
    write(
      dir,
      'ex-branch-reason.md',
      '# PLAN ex-branch-reason\n\n## Notes\n\n### Slice 1: x\n\n- Findings:\n  - 別の穴\n',
    );
    const body = collectCycle(dir);
    expect(body.startsWith('### worktree-cleanup\n\n1. ')).toBe(true);
    expect(body).toContain('\n\n### ex-branch-reason\n\n');
    expect(body).toContain(' / 別の穴');
    const numbers = body.match(/^\d+\. /gm) ?? [];
    expect(numbers).toEqual(['1. ', '2. ', '3. ', '4. ']);
  });

  it('残り物が無ければ なし', () => {
    expect(collectCycle(tmpDir())).toBe('なし');
  });
});
