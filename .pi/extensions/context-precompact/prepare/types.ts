/**
 * 準備・照合・stale 判定の型。純粋計算の境界。
 *
 * `FileOperations` は Pi の型をそのまま使う。
 */
import type { FileOperations, SessionEntry } from '@earendil-works/pi-coding-agent';
import type { Settings } from '../settings/schema.ts';

export interface CompactionSettings {
  readonly enabled: boolean;
  readonly reserveTokens: number;
  readonly keepRecentTokens: number;
}

export type PreparedMessage = Extract<SessionEntry, { type: 'message' }>['message'];

export interface PreparedCompaction {
  readonly firstKeptEntryId: string;
  readonly messagesToSummarize: readonly PreparedMessage[];
  readonly turnPrefixMessages: readonly PreparedMessage[];
  readonly isSplitTurn: boolean;
  readonly tokensBefore: number;
  readonly previousSummary?: string;
  readonly fileOps: FileOperations;
  readonly settings: CompactionSettings;
}

export interface ProjectedEntry {
  readonly sourceEntry: SessionEntry;
  readonly messages: readonly PreparedMessage[];
}

export interface PrepareStamp {
  readonly sessionId: string;
  readonly leafId: string;
  readonly latestCompactionId: string | undefined;
}

export interface Prepared {
  readonly compaction: PreparedCompaction;
  readonly stamp: PrepareStamp;
  readonly keptTokens: number;
}

export type CompareField =
  | 'firstKeptEntryId'
  | 'messagesToSummarize'
  | 'turnPrefixMessages'
  | 'previousSummary'
  | 'fileOps';

export type CompareResult =
  | { readonly kind: 'match' }
  | { readonly kind: 'mismatch'; readonly fields: readonly CompareField[] };

export interface GuardInput {
  readonly stamp: PrepareStamp;
  readonly currentSessionId: string;
  readonly branch: readonly SessionEntry[];
  readonly latestCompactionId: string | undefined;
  readonly firstKeptEntryId: string;
}

export type GuardReason =
  | 'session-changed'
  | 'leaf-not-on-branch'
  | 'first-kept-missing'
  | 'new-compaction';

export type GuardResult =
  | { readonly kind: 'ok' }
  | { readonly kind: 'stale'; readonly reason: GuardReason };

export interface ProjectedPrepareInput {
  readonly projectedEntries: readonly ProjectedEntry[];
  readonly pathEntries: readonly SessionEntry[];
  readonly settings: CompactionSettings;
  readonly tokensBefore: number;
}

export interface PrepareInput {
  readonly projectedEntries: readonly ProjectedEntry[];
  readonly branch: readonly SessionEntry[];
  readonly tokensBefore: number;
  readonly settings: Settings;
  readonly piEnabled: boolean;
  readonly sessionId: string;
}
