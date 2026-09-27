/**
 * consult 拡張の入口。道具の登録だけを行う。
 *
 * 道具の面と進行は `tool/consult.ts` と `tool/refs.ts`、整形と音は `tool/render.ts` が持つ。
 */

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { PARAMETERS, execute } from './tool/consult.ts';
import { PARAMETERS as REF_PARAMETERS, execute as refExecute } from './tool/refs.ts';

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

  pi.registerTool({
    name: 'ref_cleanup',
    label: 'Ref cleanup',
    description:
      "List and delete the refs consult leaves behind. 'list' shows every consult/ ref with its hash; 'delete' removes one, and refuses anything that is not a consult/ ref. Nothing else in the repository is touched.",
    promptSnippet: 'List or delete the refs left by consult (only consult/ refs can be deleted)',
    promptGuidelines: [
      'Use ref_cleanup after a consult child that wrote something: decide whether to take the ref in or discard it, then delete it in the same breath.',
      'A ref that is not a consult/ ref is never deleted by this tool.',
    ],
    parameters: REF_PARAMETERS,

    execute: refExecute,
  });
}
