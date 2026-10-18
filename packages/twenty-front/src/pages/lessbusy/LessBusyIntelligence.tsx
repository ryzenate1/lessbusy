import { t } from '@lingui/core/macro';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { useAiChatUsage } from '@/ai/hooks/useAiChatUsage';
import { useAiModelTiers } from '@/ai/hooks/useAiModelTiers';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { aiModelsState } from '@/client-config/states/aiModelsState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { PermissionFlagType } from '~/generated-metadata/graphql';
import { LessBusyAssistantButton } from '@/lessbusy/components/LessBusyAssistantButton';
import { LessBusyActions, LessBusyContent, LessBusyDescription, LessBusyLink, LessBusySection, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

const IntelligenceWorkspace = () => {
  const workspace = useAtomStateValue(currentWorkspaceState);
  const models = useAtomStateValue(aiModelsState);
  const tiers = useAiModelTiers();
  const { usage, loading, error } = useAiChatUsage({ fetchPolicy: 'network-only' });
  const canManageWorkspace = useHasPermissionFlag(PermissionFlagType.WORKSPACE);
  const consumed = usage?.consumedValue;
  const limit = usage?.limitValue;
  const percentage = typeof consumed === 'number' && Number.isFinite(consumed) && typeof limit === 'number' && Number.isFinite(limit) && limit > 0 ? Math.max(0, consumed / limit * 100) : null;
  const selected = tiers.find((tier) => tier.tier === workspace?.aiChatModelTier);
  return <><LessBusySection><h1>{t`Make AI useful for your team.`}</h1><LessBusyDescription>{t`Review the assistant’s available models, your current allowance and the workflows it can help with. Business actions still use your workspace permissions.`}</LessBusyDescription><LessBusyActions><LessBusyAssistantButton /><LessBusyLink to={getSettingsPath(SettingsPath.AI)}>{t`AI settings and instructions`}</LessBusyLink>{canManageWorkspace && <LessBusyLink to={getSettingsPath(SettingsPath.BillingLimits)}>{t`Manage existing usage limits`}</LessBusyLink>}</LessBusyActions></LessBusySection><LessBusySection><h2>{t`Assistant availability`}</h2>{models.length ? <><p>{t`${models.length} models available in this installation`}</p><LessBusyDescription>{t`Model availability comes from the server configuration. It does not confirm that a provider request will succeed.`}</LessBusyDescription>{selected?.model && <p>{t`Current assistant model`}: {selected.model.modelId}</p>}<LessBusyTaskList>{tiers.map((tier) => <li key={tier.tier}><h3>{tier.label}</h3><p>{tier.model?.modelId ?? t`No model configured for this tier`}</p><LessBusyDescription>{tier.isPinned ? t`Selected for this workspace` : t`Uses the server’s model selection`}</LessBusyDescription></li>)}</LessBusyTaskList></> : <><p>{t`AI setup is required.`}</p><LessBusyDescription>{t`An administrator can enable LessBusy AI and configure an OpenRouter model and server-side API key. Keep API keys in server configuration; do not paste them into chat.`}</LessBusyDescription></>}</LessBusySection><LessBusySection><h2>{t`Your current AI allowance`}</h2>{loading && <p role="status">{t`Loading allowance…`}</p>}{error ? <p role="alert">{t`Allowance data is unavailable. Open AI settings or try this page again later.`}</p> : !loading && (!usage ? <LessBusyDescription>{t`The usage service did not return a current allowance for this account. This does not establish an unlimited budget or a provider billing balance.`}</LessBusyDescription> : <>{percentage != null ? <><p>{t`${percentage.toLocaleString(undefined, { maximumFractionDigits: 1 })}% of the applicable allowance consumed`}</p><progress style={{ width: '100%', height: 16 }} max={100} value={Math.min(100, percentage)} aria-label={t`AI allowance consumed`} />{percentage >= 100 && <p>{t`The current allowance has been reached. Review the applicable limits before requesting more AI work.`}</p>}</> : <p>{t`Current consumption is unavailable.`}</p>}{usage.periodEnd && <p>{t`Current period ends`}: {new Date(usage.periodEnd).toLocaleString()}</p>}<LessBusyDescription>{t`This is the existing usage service’s applicable allowance for your workspace membership. It is not an OpenRouter currency balance or a complete provider invoice.`}</LessBusyDescription></>)}</LessBusySection><LessBusySection><h2>{t`Useful work to ask for`}</h2><LessBusyTaskList><li><h3>{t`Find the right records`}</h3><p>{t`Search customers, products, deals and invoices. Ask for a customer’s permitted sales context or your next tasks.`}</p></li><li><h3>{t`Prepare the next step`}</h3><p>{t`Review an invoice or task proposal before saving. Stock changes, payments and finalized financial records use confirmed business actions.`}</p></li><li><h3>{t`Check what is available`}</h3><p>{t`Look up product options, selling prices and available stock by location. Availability is timestamped and does not reserve goods.`}</p></li></LessBusyTaskList><LessBusyActions><LessBusyLink to="/automations">{t`Review automations`}</LessBusyLink><LessBusyLink to="/integrations">{t`Review messaging integration`}</LessBusyLink></LessBusyActions></LessBusySection></>;
};
export const LessBusyIntelligence = () => {
  const allowed = useHasPermissionFlag(PermissionFlagType.AI);
  const workspace = useAtomStateValue(currentWorkspaceState);
  return <PageCardLayout header={<PageCardHeader title={t`AI workspace`} />}><LessBusyContent>{allowed ? <IntelligenceWorkspace key={workspace?.id} /> : <LessBusySection><p>{t`Your workspace role does not allow access to the AI assistant.`}</p></LessBusySection>}</LessBusyContent></PageCardLayout>;
};
