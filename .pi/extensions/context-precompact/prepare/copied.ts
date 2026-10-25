/**
 * Pi 1.3.0 の `dist/core/compaction/compaction.js:606-659` と `dist/core/compaction/utils.js` からコピーした。
 *
 * `prepareCompaction` の本体を、`buildSessionProjection(pathEntries)` を `projectedEntries` に、
 * `estimateProjectedContextTokens` を `tokensBefore` に置き換えて写した。
 * `estimateTokens` と `sessionEntryToContextMessages` は Pi の公開 API を使い、
 * それ以外の補助関数はこのファイルに閉じ込めた。
 */
import { estimateTokens, sessionEntryToContextMessages } from '@earendil-works/pi-coding-agent';
import type { FileOperations, SessionEntry } from '@earendil-works/pi-coding-agent';
import type {
  CompactionSettings,
  PreparedCompaction,
  PreparedMessage,
  ProjectedEntry,
  ProjectedPrepareInput,
} from './types.ts';

interface ProjectedCutPoint {
  readonly firstKeptEntryIndex: number;
  readonly turnStartIndex: number;
  readonly isSplitTurn: boolean;
}

/** `createFileOps` の写し。Pi のルートから export されていないためここで作る */
function createFileOps(): FileOperations {
  return { read: new Set(), written: new Set(), edited: new Set() };
}

function isCutPointMessage(message: PreparedMessage): boolean {
  switch (message.role) {
    case 'user':
    case 'assistant':
    case 'bashExecution':
    case 'custom':
    case 'branchSummary':
    case 'compactionSummary':
      return true;
    case 'toolResult':
    case 'system':
      return false;
  }
  return false;
}

function isTurnStartMessage(message: PreparedMessage): boolean {
  switch (message.role) {
    case 'user':
    case 'bashExecution':
    case 'custom':
    case 'branchSummary':
    case 'compactionSummary':
      return true;
    case 'assistant':
    case 'toolResult':
    case 'system':
      return false;
  }
  return false;
}

function isProjectedTurnStart(entry: ProjectedEntry): boolean {
  if (entry.sourceEntry.type === 'compaction') {
    return false;
  }
  return entry.messages.some(isTurnStartMessage);
}

function findProjectedTurnStartIndex(
  entries: readonly ProjectedEntry[],
  entryIndex: number,
  startIndex: number,
): number {
  for (let i = entryIndex; i >= startIndex; i--) {
    const entry = entries[i];
    if (entry !== undefined && isProjectedTurnStart(entry)) {
      return i;
    }
  }
  return -1;
}

function isIntrinsicallyVisible(entry: ProjectedEntry): boolean {
  return (
    entry.sourceEntry.type !== 'context_edit' &&
    sessionEntryToContextMessages(entry.sourceEntry).length > 0
  );
}

function isOmitted(entry: ProjectedEntry): boolean {
  return isIntrinsicallyVisible(entry) && entry.messages.length === 0;
}

function collectProjectedCutPoints(
  entries: readonly ProjectedEntry[],
  startIndex: number,
  endIndex: number,
): number[] {
  const cutPoints: number[] = [];
  for (let i = startIndex; i < endIndex; i++) {
    const entry = entries[i];
    if (
      entry !== undefined &&
      entry.sourceEntry.type !== 'compaction' &&
      entry.messages.some(isCutPointMessage)
    ) {
      cutPoints.push(i);
    }
  }
  return cutPoints;
}

function findBudgetCutIndex(input: {
  readonly entries: readonly ProjectedEntry[];
  readonly cutPoints: readonly number[];
  readonly startIndex: number;
  readonly endIndex: number;
  readonly keepRecentTokens: number;
}): { readonly cutIndex: number; readonly exceededBudget: boolean } {
  const { entries, cutPoints, startIndex, endIndex, keepRecentTokens } = input;
  let accumulatedTokens = 0;
  let cutIndex = cutPoints[0] ?? startIndex;
  for (let i = endIndex - 1; i >= startIndex; i--) {
    const entry = entries[i];
    if (entry === undefined) {
      continue;
    }
    let messageTokens = 0;
    for (const message of entry.messages) {
      messageTokens += estimateTokens(message);
    }
    if (messageTokens === 0) {
      continue;
    }
    accumulatedTokens += messageTokens;
    if (accumulatedTokens >= keepRecentTokens) {
      cutIndex =
        cutPoints.find((candidate) => candidate >= i) ??
        cutPoints[cutPoints.length - 1] ??
        startIndex;
      return { cutIndex, exceededBudget: true };
    }
  }
  return { cutIndex, exceededBudget: false };
}

function isRecoveryOmission(
  entries: readonly ProjectedEntry[],
  cutIndex: number,
  endIndex: number,
  exceededBudget: boolean,
): boolean {
  const suffix = entries.slice(cutIndex + 1, endIndex);
  const omittedSuffixIds = new Set(suffix.filter(isOmitted).map((entry) => entry.sourceEntry.id));
  const hasExternalReplacement = suffix.some(
    (entry) =>
      entry.sourceEntry.type === 'context_edit' &&
      entry.sourceEntry.replacement !== null &&
      !omittedSuffixIds.has(entry.sourceEntry.targetId),
  );
  return (
    exceededBudget &&
    !hasExternalReplacement &&
    suffix.some(
      (entry) =>
        entry.sourceEntry.type === 'message' &&
        entry.sourceEntry.message.role === 'assistant' &&
        isOmitted(entry),
    ) &&
    suffix.every(
      (entry) =>
        entry.sourceEntry.type !== 'compaction' &&
        (!isIntrinsicallyVisible(entry) || isOmitted(entry)),
    )
  );
}

function rewindOverMetadata(
  entries: readonly ProjectedEntry[],
  cutIndex: number,
  startIndex: number,
): number {
  let rewound = cutIndex;
  while (rewound > startIndex) {
    const previous = entries[rewound - 1];
    if (
      previous === undefined ||
      previous.sourceEntry.type === 'compaction' ||
      previous.messages.length > 0
    ) {
      break;
    }
    rewound--;
  }
  return rewound;
}

function findProjectedCutPoint(
  entries: readonly ProjectedEntry[],
  startIndex: number,
  endIndex: number,
  keepRecentTokens: number,
): ProjectedCutPoint {
  const cutPoints = collectProjectedCutPoints(entries, startIndex, endIndex);
  if (cutPoints.length === 0) {
    return { firstKeptEntryIndex: startIndex, turnStartIndex: -1, isSplitTurn: false };
  }
  const budget = findBudgetCutIndex({ entries, cutPoints, startIndex, endIndex, keepRecentTokens });
  let cutIndex = budget.cutIndex;
  if (isRecoveryOmission(entries, cutIndex, endIndex, budget.exceededBudget)) {
    cutIndex++;
  }
  cutIndex = rewindOverMetadata(entries, cutIndex, startIndex);
  const current = entries[cutIndex];
  if (current === undefined) {
    return { firstKeptEntryIndex: startIndex, turnStartIndex: -1, isSplitTurn: false };
  }
  const startsTurn = isProjectedTurnStart(current);
  const turnStartIndex = startsTurn
    ? -1
    : findProjectedTurnStartIndex(entries, cutIndex, startIndex);
  return {
    firstKeptEntryIndex: cutIndex,
    turnStartIndex,
    isSplitTurn: !startsTurn && turnStartIndex !== -1,
  };
}

function getMessagesFromProjectedEntryForCompaction(entry: ProjectedEntry): PreparedMessage[] {
  if (entry.sourceEntry.type === 'compaction') {
    return [];
  }
  return entry.messages.filter((message) => message.role !== 'system');
}

function addFileOp(toolName: string, args: unknown, fileOps: FileOperations): void {
  const path =
    typeof args === 'object' && args !== null && 'path' in args && typeof args.path === 'string'
      ? args.path
      : undefined;
  if (path === undefined) {
    return;
  }
  switch (toolName) {
    case 'read':
      fileOps.read.add(path);
      break;
    case 'write':
      fileOps.written.add(path);
      break;
    case 'edit':
      fileOps.edited.add(path);
      break;
    default:
      break;
  }
}

function extractFileOpsFromMessage(message: PreparedMessage, fileOps: FileOperations): void {
  if (message.role === 'toolResult') {
    const nested = message.nestedCalls?.calls ?? [];
    for (const call of nested) {
      addFileOp(call.name, call.arguments, fileOps);
    }
    return;
  }
  if (message.role !== 'assistant') {
    return;
  }
  if (!('content' in message) || !Array.isArray(message.content)) {
    return;
  }
  for (const block of message.content) {
    if (typeof block !== 'object' || block === null) {
      continue;
    }
    if (!('type' in block) || block.type !== 'toolCall') {
      continue;
    }
    if (!('arguments' in block) || !('name' in block)) {
      continue;
    }
    addFileOp(block.name, block.arguments, fileOps);
  }
}

function extractFileOperations(
  messages: readonly PreparedMessage[],
  entries: readonly SessionEntry[],
  prevCompactionIndex: number,
): FileOperations {
  const fileOps = createFileOps();
  if (prevCompactionIndex >= 0) {
    const prevCompaction = entries[prevCompactionIndex];
    if (
      prevCompaction !== undefined &&
      prevCompaction.type === 'compaction' &&
      !prevCompaction.fromHook &&
      prevCompaction.details !== undefined &&
      typeof prevCompaction.details === 'object' &&
      prevCompaction.details !== null
    ) {
      const details = prevCompaction.details as { readFiles?: unknown; modifiedFiles?: unknown };
      if (Array.isArray(details.readFiles)) {
        for (const f of details.readFiles) {
          if (typeof f === 'string') {
            fileOps.read.add(f);
          }
        }
      }
      if (Array.isArray(details.modifiedFiles)) {
        for (const f of details.modifiedFiles) {
          if (typeof f === 'string') {
            fileOps.edited.add(f);
          }
        }
      }
    }
  }
  for (const msg of messages) {
    extractFileOpsFromMessage(msg, fileOps);
  }
  return fileOps;
}

/** 投影と現在トークンから要約の下ごしらえを作る。無ければ `undefined` */
export function prepareFromProjection(
  input: ProjectedPrepareInput,
): PreparedCompaction | undefined {
  const { projectedEntries, pathEntries, settings, tokensBefore } = input;
  const lastPath = pathEntries[pathEntries.length - 1];
  if (lastPath !== undefined && lastPath.type === 'compaction') {
    return undefined;
  }
  const sourceEntries = projectedEntries.map((entry) => entry.sourceEntry);
  const prevCompactionIndex = projectedEntries.findIndex(
    (entry) => entry.sourceEntry.type === 'compaction' && entry.messages.length > 0,
  );
  let previousSummary: string | undefined;
  let boundaryStart = 0;
  if (prevCompactionIndex >= 0) {
    const prev = projectedEntries[prevCompactionIndex]?.sourceEntry;
    if (prev !== undefined && prev.type === 'compaction') {
      previousSummary = prev.summary;
    }
    boundaryStart = prevCompactionIndex + 1;
  }
  const boundaryEnd = projectedEntries.length;
  const cutPoint = findProjectedCutPoint(
    projectedEntries,
    boundaryStart,
    boundaryEnd,
    settings.keepRecentTokens,
  );
  const firstKeptEntry = projectedEntries[cutPoint.firstKeptEntryIndex]?.sourceEntry;
  if (firstKeptEntry?.id === undefined) {
    return undefined;
  }
  const firstKeptEntryId = firstKeptEntry.id;
  const historyEnd = cutPoint.isSplitTurn ? cutPoint.turnStartIndex : cutPoint.firstKeptEntryIndex;
  const messagesToSummarize = projectedEntries
    .slice(boundaryStart, historyEnd)
    .flatMap(getMessagesFromProjectedEntryForCompaction);
  const turnPrefixMessages = cutPoint.isSplitTurn
    ? projectedEntries
        .slice(cutPoint.turnStartIndex, cutPoint.firstKeptEntryIndex)
        .flatMap(getMessagesFromProjectedEntryForCompaction)
    : [];
  if (messagesToSummarize.length === 0 && turnPrefixMessages.length === 0) {
    return undefined;
  }
  const fileOps = extractFileOperations(messagesToSummarize, sourceEntries, prevCompactionIndex);
  if (cutPoint.isSplitTurn) {
    for (const msg of turnPrefixMessages) {
      extractFileOpsFromMessage(msg, fileOps);
    }
  }
  const resultSettings: CompactionSettings = {
    enabled: settings.enabled,
    reserveTokens: settings.reserveTokens,
    keepRecentTokens: settings.keepRecentTokens,
  };
  return {
    firstKeptEntryId,
    messagesToSummarize,
    turnPrefixMessages,
    isSplitTurn: cutPoint.isSplitTurn,
    tokensBefore,
    previousSummary,
    fileOps,
    settings: resultSettings,
  };
}
