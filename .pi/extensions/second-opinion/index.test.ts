import { describe, expect, it } from 'vitest';
import { DEFAULT_MESSAGES, TOOL_NAME, parseCommandArgs, toRequest } from './index.ts';

// 子を走らせない分だけを試す（文字列の組み立て）。子の起動は Slice 4 の統合で扱う。

describe('toRequest', () => {
  it('既定の質問と件数 20（何も渡さない）', () => {
    expect(toRequest({})).toEqual({});
    expect(DEFAULT_MESSAGES).toBe(20);
  });

  it('focus の上書き', () => {
    expect(toRequest({ focus: 'is this consistent?' })).toEqual({ focus: 'is this consistent?' });
  });

  it('空の focus は指定なしとみなす', () => {
    expect(toRequest({ focus: '   ' })).toEqual({});
  });

  it('messages の上書き', () => {
    expect(toRequest({ messages: 5 })).toEqual({ messages: 5 });
  });

  it('道具の名前は opinion', () => {
    expect(TOOL_NAME).toBe('opinion');
  });
});

describe('parseCommandArgs', () => {
  it('先頭が数字なら件数、残りが質問', () => {
    expect(parseCommandArgs('10 is this consistent?')).toEqual({
      messages: 10,
      focus: 'is this consistent?',
    });
  });

  it('数字だけなら件数だけ', () => {
    expect(parseCommandArgs('10')).toEqual({ messages: 10 });
  });

  it('数字でなければ質問だけ', () => {
    expect(parseCommandArgs('is this consistent?')).toEqual({ focus: 'is this consistent?' });
  });

  it('空なら既定の質問（空の依頼）', () => {
    expect(parseCommandArgs('')).toEqual({});
    expect(parseCommandArgs('   ')).toEqual({});
  });
});
