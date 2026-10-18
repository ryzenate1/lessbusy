import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { lessBusyModulePreferencesState } from '@/lessbusy/states/lessBusyModulePreferencesState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const useLessBusyEnabledModules = () => {
  const workspace = useAtomStateValue(currentWorkspaceState);
  const preferences = useAtomStateValue(lessBusyModulePreferencesState);
  return preferences && preferences.workspaceId === workspace?.id ? preferences.enabledModules : null;
};
