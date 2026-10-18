import { styled } from '@linaria/react';
import { Trans, useLingui } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { useWorkspaceBypass } from '@/auth/sign-in-up/hooks/useWorkspaceBypass';
import { getAppWebsiteUrl, type LegalPage } from '@/auth/utils/getAppWebsiteUrl';
import { useIsCurrentLocationOnAWorkspace } from '@/domain-manager/hooks/useIsCurrentLocationOnAWorkspace';
import { ONBOARDING_CONTENT_BLOCK_WIDTH } from '@/onboarding/constants/OnboardingContentBlockWidth';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledCopyContainer = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.4;
  max-width: ${ONBOARDING_CONTENT_BLOCK_WIDTH}px;
  text-align: center;

  & > a {
    color: ${themeCssVariables.font.color.tertiary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const StyledLinksContainer = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-wrap: nowrap;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  justify-content: center;
  max-width: 100%;
  text-align: center;
  white-space: nowrap;

  & > a,
  & > button {
    background: none;
    border: none;
    color: ${themeCssVariables.font.color.tertiary};
    cursor: pointer;
    font: inherit;
    padding: 0;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const StyledSeparator = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
`;

const renderLegalLink = (page: LegalPage, node: ReactNode) => {
  const url = getAppWebsiteUrl(page);

  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {node}
    </a>
  ) : (
    node
  );
};

type FooterNoteProps = {
  secondaryAgreement?: 'privacyPolicy' | 'dataProcessingAgreement';
};

export const FooterNote = ({
  secondaryAgreement = 'privacyPolicy',
}: FooterNoteProps) => {
  const { isOnAWorkspace } = useIsCurrentLocationOnAWorkspace();
  const { i18n } = useLingui();

  const { shouldOfferBypass, shouldUseBypass, enableBypass } =
    useWorkspaceBypass();

  if (!isOnAWorkspace) {
    return (
      <StyledCopyContainer>
        <Trans>By using LessBusy, you agree to the</Trans>{' '}
        {renderLegalLink(
          'terms',
          <Trans>Terms of Service</Trans>,
        )}{' '}
        <Trans>and</Trans>{' '}
        {secondaryAgreement === 'dataProcessingAgreement'
          ? renderLegalLink(
              'dpa',
              <Trans>Data Processing Agreement</Trans>,
            )
          : renderLegalLink(
              'privacy-policy',
              <Trans>Privacy Policy</Trans>,
            )}
        .
      </StyledCopyContainer>
    );
  }

  return (
    <StyledLinksContainer>
      {shouldOfferBypass && !shouldUseBypass && (
        <>
          <button type="button" onClick={enableBypass}>
            <Trans>Bypass SSO</Trans>
          </button>
          <StyledSeparator>•</StyledSeparator>
        </>
      )}
      {renderLegalLink(
        'privacy-policy',
        <Trans>Privacy Policy</Trans>,
      )}
      <StyledSeparator>•</StyledSeparator>
      {renderLegalLink(
        'terms',
        <Trans>Terms of Service</Trans>,
      )}
    </StyledLinksContainer>
  );
};
