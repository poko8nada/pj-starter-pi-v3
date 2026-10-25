/**
 * 要約の口。Pi の `compact()` 公開 API に準備と認証を渡す。
 *
 * `Outside: Pi の compact() 公開 API`。`Outside: モデルプロバイダの認証 / API`。
 */
import {
  type CompactionResult,
  type ExtensionContext,
  type compact,
} from '@earendil-works/pi-coding-agent';
import type { PreparedCompaction } from '../prepare/types.ts';

/** モデルが無いときの理由 */
export const NO_MODEL_REASON = 'context-precompact: no model available';

export interface CompactRequest {
  readonly preparation: PreparedCompaction;
  readonly signal: AbortSignal;
}

export interface SummaryPorts {
  readonly compact: (request: CompactRequest) => Promise<CompactionResult>;
}

export interface SummaryCtx {
  readonly model: ExtensionContext['model'];
  readonly modelRegistry: ExtensionContext['modelRegistry'];
  readonly thinkingLevel: ExtensionContext['thinkingLevel'];
  readonly sessionManager: ExtensionContext['sessionManager'];
  readonly compactFn: typeof compact;
}

/** null のヘッダを落として、`compact()` が受ける形にする */
function headersOf(
  headers: Readonly<Record<string, string | null>> | undefined,
): Record<string, string> | undefined {
  if (headers === undefined) {
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value !== null) {
      out[key] = value;
    }
  }
  return out;
}

/** 要約の口を作る。モデル無し・認証失敗は throw */
export function createSummaryPorts(ctx: SummaryCtx): SummaryPorts {
  if (ctx.model === undefined) {
    throw new Error(NO_MODEL_REASON);
  }
  const model = ctx.model;
  return {
    compact: async (request: CompactRequest): Promise<CompactionResult> => {
      const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
      if (!auth.ok) {
        throw new Error(auth.error);
      }
      const preparation = {
        ...request.preparation,
        messagesToSummarize: [...request.preparation.messagesToSummarize],
        turnPrefixMessages: [...request.preparation.turnPrefixMessages],
      };
      return ctx.compactFn(
        preparation,
        model,
        auth.apiKey,
        headersOf(auth.headers),
        undefined,
        request.signal,
        ctx.thinkingLevel,
        undefined,
        auth.env,
        undefined,
        undefined,
        ctx.sessionManager.getSessionId(),
      );
    },
  };
}
