import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { IconSparkles } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { useOpenAskAiPageInSidePanel } from '@/side-panel/hooks/useOpenAskAiPageInSidePanel';
import { PermissionFlagType } from '~/generated-metadata/graphql';

const StyledButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  font: inherit;
  gap: ${themeCssVariables.spacing[2]};
  min-height: 44px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &:hover {
    background: ${themeCssVariables.background.tertiary};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: 2px;
  }

  @media (max-width: 760px) {
    span {
      display: none;
    }
    min-width: 44px;
    padding: 0;
    justify-content: center;
  }
`;

export const LessBusyAssistantButton = () => {
  const hasAiPermission = useHasPermissionFlag(PermissionFlagType.AI);
  const { openAskAiPage } = useOpenAskAiPageInSidePanel();

  if (!hasAiPermission) {
    return null;
  }

  return (
    <StyledButton
      type="button"
      aria-label={t`Ask LessBusy AI`}
      onClick={() => openAskAiPage()}
    >
      <IconSparkles size={18} aria-hidden="true" />
      <span>{t`Ask LessBusy AI`}</span>
    </StyledButton>
  );
};
