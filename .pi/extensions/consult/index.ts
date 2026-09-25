/**
 * consult 拡張の入口。道具の登録だけを行う。
 *
 * 道具の面と進行は `tool/consult.ts`、整形と音は `tool/render.ts` が持つ。
 */

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { PARAMETERS, execute } from './tool/consult.ts';

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: 'consult',
    label: 'Consult',
    description:
      "Run a child pi with the policy of a type (model, tools, environment, limits, role) and return its final text. The caller picks only the type. It does not see this conversation. If the first model cannot run, the other candidates of the type are tried, and finally the parent's own settings. One child per input; the results are listed per input.",
    promptSnippet:
      'Run a child pi with a type (research / review / trial / code) and get its text back',
    promptGuidelines: [
      'Use consult when a question is better answered without this conversation in view: reviewing your own work, getting a second opinion, or applying a role you were not given.',
      'The types and their limits live in .pi/extensions/consult/types.json. The caller cannot override them; to change the policy, edit that file.',
    ],
    parameters: PARAMETERS,

    execute,
  });
}
