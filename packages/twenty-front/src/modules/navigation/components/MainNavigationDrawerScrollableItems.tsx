import { t } from '@lingui/core/macro';
import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { NavigationDrawerOpenedSection } from '@/navigation-menu-item/display/sections/components/NavigationDrawerOpenedSection';
import { LessBusyWorkflowNavigation } from '@/lessbusy/components/LessBusyWorkflowNavigation';
import { NavigationDrawerWorkspaceSectionSkeletonLoader } from '@/object-metadata/components/NavigationDrawerWorkspaceSectionSkeletonLoader';

import { styled } from '@linaria/react';
import { lazy, Suspense } from 'react';

import { themeCssVariables } from 'twenty-ui/theme';

const FavoritesSectionDispatcher = lazy(() =>
  import('@/navigation-menu-item/display/sections/favorites/components/FavoritesSectionDispatcher').then(
    (module) => ({
      default: module.FavoritesSectionDispatcher,
    }),
  ),
);

const WorkspaceSectionDispatcher = lazy(() =>
  import('@/navigation-menu-item/display/sections/workspace/components/WorkspaceSectionDispatcher').then(
    (module) => ({
      default: module.WorkspaceSectionDispatcher,
    }),
  ),
);

const StyledScrollableItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledSavedMenu = styled.details`
  summary { color: ${themeCssVariables.font.color.secondary}; cursor: pointer; min-height: 44px; padding: 0 16px; display: list-item; align-content: center; }
`;

export const MainNavigationDrawerScrollableItems = () => {
  const isCustomizing = useAtomStateValue(isLayoutCustomizationModeEnabledState);
  return (
    <StyledScrollableItemsContainer>
      <LessBusyWorkflowNavigation />
      <NavigationDrawerOpenedSection />
      <Suspense fallback={<NavigationDrawerWorkspaceSectionSkeletonLoader />}>
        <FavoritesSectionDispatcher />
        <StyledSavedMenu open={isCustomizing ? true : undefined}><summary>{t`Saved views & workspace menu`}</summary><WorkspaceSectionDispatcher /></StyledSavedMenu>
      </Suspense>
    </StyledScrollableItemsContainer>
  );
};
