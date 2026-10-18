import { useState } from 'react';
import { t } from '@lingui/core/macro';
import { escapeForIlike, getAppPath } from 'twenty-shared/utils';
import { AppPath } from 'twenty-shared/types';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { PermissionFlagType } from '~/generated-metadata/graphql';
import { useOpenAskAiPageInSidePanel } from '@/side-panel/hooks/useOpenAskAiPageInSidePanel';
import { useStageAiChatPreprompt } from '@/ai/hooks/useStageAiChatPreprompt';
import { serializePlainTextAsAdvancedTextEditorDocument } from '@/advanced-text-editor/utils/serializePlainTextAsAdvancedTextEditorDocument';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

type Workflow = ObjectRecord & { name: string | null; statuses: string[] | null; coreWorkflowId?: string | null };
const AutomationsWorkspace = () => {
  const { object, canWrite, canReadFields } = useLessBusyObjectAccess('workflow');
  const canAskAi = useHasPermissionFlag(PermissionFlagType.AI);
  const { openAskAiPage } = useOpenAskAiPageInSidePanel();
  const { stageAiChatPreprompt } = useStageAiChatPreprompt();
  const [query, setQuery] = useState(''); const [search, setSearch] = useState('');
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<Workflow>({ objectNameSingular: 'workflow', ...(search ? { filter: { name: { ilike: `%${escapeForIlike(search)}%` } } } : {}), limit: 25, orderBy: [{ updatedAt: 'DescNullsLast' }], recordGqlFields: { id: true, name: true, ...(canReadFields('statuses') ? { statuses: true } : {}), ...(canReadFields('coreWorkflowId') ? { coreWorkflowId: true } : {}) } });
  const recipes = [
    { title: t`Follow up after a won deal`, description: t`Plan a task for the deal owner after a successful sale.`, prompt: t`Help me plan an automation that creates one follow-up task for the owner seven days after a deal is won. Use my workspace's actual stages, prevent duplicate tasks and explain the trigger and permissions. Do not create or activate anything until I review the plan.` },
    { title: t`Review high-priority enquiries`, description: t`Plan a team review when an enquiry becomes high priority.`, prompt: t`Help me plan an automation for high-priority LessBusy enquiries. Keep buying readiness and handling status separate, avoid duplicate follow-ups, respect manually protected qualifications, and ask me who should own the task. Do not create or activate anything yet.` },
    { title: t`Plan a daily task reminder`, description: t`Choose a schedule and reminder channel before enabling it.`, prompt: t`Help me plan a daily reminder for overdue tasks. Ask for my timezone, schedule and allowed reminder channel. Use authorized workspace data, avoid repeated reminders and explain who would receive notifications. Do not create, send or activate anything until I confirm.` },
  ];
  return <><LessBusySection><h1>{t`Useful routines, clearly explained.`}</h1><LessBusyDescription>{t`Keep the existing workflow engine, with triggers, versions and run history available when you need them. Plan a routine, review its actions and enable it through the workflow editor.`}</LessBusyDescription><LessBusyActions>{object && <LessBusyLink to={getAppPath(AppPath.RecordIndexPage, { objectNamePlural: object.namePlural })}>{canWrite ? t`Create or manage a workflow` : t`All workflow views and history`}</LessBusyLink>}</LessBusyActions></LessBusySection><LessBusySection><h2>{t`Your automations`}</h2><LessBusyForm onSubmit={(event) => { event.preventDefault(); setSearch(query.trim()); }}><label>{t`Search automations`}<input type="search" maxLength={200} value={query} onChange={(event) => setQuery(event.target.value)} /></label><LessBusyRetry type="submit">{t`Search`}</LessBusyRetry></LessBusyForm>{loading && <p role="status">{t`Loading automations…`}</p>}{error ? <><p role="alert">{t`Could not load automations.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : <><LessBusyTaskList>{records.map((workflow) => {
    const active = workflow.statuses?.includes('ACTIVE'); const draft = workflow.statuses?.includes('DRAFT');
    const path = workflow.coreWorkflowId ? getAppPath(AppPath.WorkflowCoreShowPage, { coreWorkflowId: workflow.coreWorkflowId }) : `/object/workflow/${workflow.id}`;
    return <li key={workflow.id}><LessBusyLink to={path}>{workflow.name || t`Unnamed workflow`}</LessBusyLink><LessBusyDescription>{active ? (draft ? t`Active, with draft changes` : t`Active`) : draft ? t`Draft — not active` : workflow.statuses ? t`Inactive` : t`Open the workflow to review its status`}</LessBusyDescription></li>;
  })}</LessBusyTaskList>{!loading && !records.length && <LessBusyDescription>{t`No automations in this view. Start with one useful routine and review it before activation.`}</LessBusyDescription>}{hasNextPage && <LessBusyRetry onClick={() => void fetchMoreRecords()}>{t`Load more automations`}</LessBusyRetry>}</>}</LessBusySection>{canAskAi && <LessBusySection><h2>{t`Plan your next routine`}</h2><LessBusyTaskList>{recipes.map((recipe) => <li key={recipe.title}><h3>{recipe.title}</h3><LessBusyDescription>{recipe.description}</LessBusyDescription><LessBusyRetry onClick={() => { openAskAiPage(); stageAiChatPreprompt({ serializedDocument: serializePlainTextAsAdvancedTextEditorDocument(recipe.prompt), mode: 'PREFILL' }); }}>{t`Plan with LessBusy AI`}</LessBusyRetry></li>)}</LessBusyTaskList></LessBusySection>}</>;
};

export const LessBusyAutomations = () => {
  const workspace = useAtomStateValue(currentWorkspaceState); const access = useLessBusyObjectAccess('workflow');
  return <PageCardLayout header={<PageCardHeader title={t`Automations`} />}><LessBusyContent>{access.canReadFields('name') ? <AutomationsWorkspace key={workspace?.id} /> : <LessBusySection><LessBusyDescription>{t`Automations are available when your workspace role can read workflows.`}</LessBusyDescription></LessBusySection>}</LessBusyContent></PageCardLayout>;
};
