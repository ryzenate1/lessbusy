import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getLessBusyObjectPresentation } from '@/lessbusy/utils/getLessBusyObjectPresentation';

export const useObjectLabel = (
  objectMetadataItem: EnrichedObjectMetadataItem,
) => {
  return objectMetadataItem ? getLessBusyObjectPresentation(objectMetadataItem).singular : '';
};
