import { useLessBusyEnabledModules } from '@/lessbusy/hooks/useLessBusyEnabledModules';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { getLessBusyDestinations } from '@/lessbusy/utils/getLessBusyDestinations';

export const useLessBusyDestinations = () => {
  const enabledModules = useLessBusyEnabledModules();
  const objects = useAtomStateValue(objectMetadataItemsSelector);
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();

  return getLessBusyDestinations({
    objects,
    permissions: objectPermissionsByObjectMetadataId,
  }).filter((destination) => !enabledModules || destination.nameSingular === 'lbBusinessProfile' || enabledModules.includes(destination.nameSingular));
};
