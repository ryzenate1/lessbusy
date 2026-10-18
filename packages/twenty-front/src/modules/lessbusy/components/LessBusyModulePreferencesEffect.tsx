import { useEffect } from 'react';
import { z } from 'zod';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { lessBusyModulePreferencesState } from '@/lessbusy/states/lessBusyModulePreferencesState';

const LoadPreferences = ({ workspaceId }: { workspaceId: string }) => {
  const setPreferences = useSetAtomState(lessBusyModulePreferencesState);
  const { records } = useFindManyRecords({ objectNameSingular: 'lbBusinessProfile', recordGqlFields: { id: true, enabledModules: true }, filter: { profileKey: { eq: 'workspace' } }, limit: 1 });
  const modules = z.array(z.string()).safeParse(records[0]?.enabledModules);
  const moduleKey = modules.success ? JSON.stringify(modules.data) : '';
  useEffect(() => { setPreferences(moduleKey ? { workspaceId, enabledModules: JSON.parse(moduleKey) as string[] } : null); }, [moduleKey, workspaceId, setPreferences]);
  return null;
};

export const LessBusyModulePreferencesEffect = () => {
  const workspace = useAtomStateValue(currentWorkspaceState);
  const objects = useAtomStateValue(objectMetadataItemsSelector);
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const profile = objects.find((object) => object.nameSingular === 'lbBusinessProfile' && object.isActive);
  if (!workspace || !profile || !objectPermissionsByObjectMetadataId[profile.id]?.canReadObjectRecords || !profile.readableFields.some((field) => field.name === 'enabledModules')) return null;
  return <LoadPreferences key={workspace.id} workspaceId={workspace.id} />;
};
