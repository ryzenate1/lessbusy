import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const useLessBusyObjectAccess = (objectName: string) => {
  const objects = useAtomStateValue(objectMetadataItemsSelector);
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const object = objects.find((candidate) => candidate.nameSingular === objectName && candidate.isActive);
  const permissions = object ? objectPermissionsByObjectMetadataId[object.id] : undefined;
  const canRead = Boolean(permissions?.canReadObjectRecords);
  return {
    object, canRead, canWrite: Boolean(permissions?.canUpdateObjectRecords),
    canWriteFields: (...names: string[]) => Boolean(permissions?.canUpdateObjectRecords) && names.every((name) => object?.updatableFields.some((field) => field.name === name)),
    canReadFields: (...names: string[]) => canRead && names.every((name) => object?.readableFields.some((field) => field.name === name)),
  };
};
