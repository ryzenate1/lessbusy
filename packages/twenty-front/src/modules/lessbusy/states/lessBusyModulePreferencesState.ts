import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const lessBusyModulePreferencesState = createAtomState<{ workspaceId: string; enabledModules: string[] } | null>({ key: 'lessBusyModulePreferencesState', defaultValue: null });
