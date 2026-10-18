import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useWorkspaceSurface } from '@/ui/layout/hooks/useWorkspaceSurface';
import { getLessBusyObjectPresentation } from '@/lessbusy/utils/getLessBusyObjectPresentation';

const StyledIntroduction = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: 16px;
  line-height: 1.5;
  padding: 20px 24px 12px;
`;

export const LessBusyRecordIntroduction = () => {
  const { objectMetadataItem } = useRecordIndexContextOrThrow();
  const surface = useWorkspaceSurface();
  const { description } = getLessBusyObjectPresentation(objectMetadataItem);

  if (!description || surface.type !== 'main') {
    return null;
  }

  return <StyledIntroduction>{description}</StyledIntroduction>;
};
