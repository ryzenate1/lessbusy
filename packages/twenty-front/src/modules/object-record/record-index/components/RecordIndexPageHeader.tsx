import { LessBusyRecordActions } from '@/lessbusy/components/LessBusyRecordActions';
import { RecordIndexCommandMenu } from '@/command-menu-item/components/RecordIndexCommandMenu';
import { getLessBusyObjectPresentation } from '@/lessbusy/utils/getLessBusyObjectPresentation';
import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { contextStoreNumberOfSelectedRecordsComponentState } from '@/context-store/states/contextStoreNumberOfSelectedRecordsComponentState';
import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { RecordIndexPageHeaderTitle } from '@/object-record/record-index/components/RecordIndexPageHeaderTitle';
import { RecordIndexPageHeaderIcon } from '@/object-record/record-index/components/RecordIndexPageHeaderIcon';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { SidePanelPageTitleSyncEffect } from '@/side-panel/components/SidePanelPageTitleSyncEffect';
import { SidePanelToggleButton } from '@/side-panel/components/SidePanelToggleButton';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { useWorkspaceSurface } from '@/ui/layout/hooks/useWorkspaceSurface';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isDefined } from 'twenty-shared/utils';

export const RecordIndexPageHeader = () => {
  const workspaceSurface = useWorkspaceSurface();

  const { findObjectMetadataItemByNamePlural } =
    useFilteredObjectMetadataItems();

  const contextStoreNumberOfSelectedRecords = useAtomComponentStateValue(
    contextStoreNumberOfSelectedRecordsComponentState,
  );

  const { objectNamePlural } = useRecordIndexContextOrThrow();

  const objectMetadataItem =
    findObjectMetadataItemByNamePlural(objectNamePlural);

  const label = objectMetadataItem ? getLessBusyObjectPresentation(objectMetadataItem).plural : objectNamePlural;

  const contextStoreCurrentViewId = useAtomComponentStateValue(
    contextStoreCurrentViewIdComponentState,
  );
  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );

  return (
    <>
      <SidePanelPageTitleSyncEffect pageTitle={label} />
      <PageCardHeader
        icon={
          <RecordIndexPageHeaderIcon objectMetadataItem={objectMetadataItem} />
        }
        title={
          <RecordIndexPageHeaderTitle
            label={label}
            numberOfSelectedRecords={contextStoreNumberOfSelectedRecords}
          />
        }
        actionButton={
          isDefined(contextStoreCurrentViewId) ? (
            <>
              {workspaceSurface.type === 'main' && objectMetadataItem && <LessBusyRecordActions objectNameSingular={objectMetadataItem.nameSingular} />}
              <RecordIndexCommandMenu />
              {!isLayoutCustomizationModeEnabled &&
                workspaceSurface.type === 'main' && <SidePanelToggleButton />}
            </>
          ) : undefined
        }
      />
    </>
  );
};
