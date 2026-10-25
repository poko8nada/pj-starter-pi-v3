/**
 * Pi の準備とこちらの準備の照合。5 項目が同じときだけ `match`。
 */
import type { CompareResult, CompareField, PreparedCompaction } from './types.ts';

function setsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
}

/** 2 つの下ごしらえを比べ、不一致の field 名を返す */
export function compare(ours: PreparedCompaction, theirs: PreparedCompaction): CompareResult {
  const fields: CompareField[] = [];
  if (ours.firstKeptEntryId !== theirs.firstKeptEntryId) {
    fields.push('firstKeptEntryId');
  }
  if (ours.messagesToSummarize.length !== theirs.messagesToSummarize.length) {
    fields.push('messagesToSummarize');
  }
  if (ours.turnPrefixMessages.length !== theirs.turnPrefixMessages.length) {
    fields.push('turnPrefixMessages');
  }
  if (ours.previousSummary !== theirs.previousSummary) {
    fields.push('previousSummary');
  }
  if (
    !setsEqual(ours.fileOps.read, theirs.fileOps.read) ||
    !setsEqual(ours.fileOps.written, theirs.fileOps.written) ||
    !setsEqual(ours.fileOps.edited, theirs.fileOps.edited)
  ) {
    fields.push('fileOps');
  }
  if (fields.length === 0) {
    return { kind: 'match' };
  }
  return { kind: 'mismatch', fields };
}
