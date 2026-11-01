/**
 * 要約の窓口である。Pi の `compact()` 公開 API に準備と認証を渡す。
 *
 * `Outside` は Pi の `compact()` 公開 API である。`Outside` はモデルプロバイダの認証と API である。
 */
import {
  type CompactionResult,
  type ExtensionContext,
  type compact,
} from '@earendil-works/pi-coding-agent';
import type { PreparedCompaction } from '../prepare/types.ts';

/** モデルがないときの理由である。 */
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

/** null のヘッダを取り除き、`compact()` が受ける形にする。 */
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

/** 要約の窓口を作る。モデルなしと認証失敗は例外を投げる。 */
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
