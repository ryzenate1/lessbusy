import { type I18n } from '@lingui/core';
import { Column, Container, Row } from 'react-email';

import { Link } from 'src/components/Link';
import { ShadowText } from 'src/components/ShadowText';

import {
  EMAIL_API_DOCS_URL,
  EMAIL_GITHUB_URL,
  EMAIL_LEGAL_NAME,
  EMAIL_USER_GUIDE_URL,
  EMAIL_WEBSITE_URL,
} from 'src/constants/branding';

const footerContainerStyle = {
  marginTop: '12px',
};

type FooterProps = {
  i18n: I18n;
};

export const Footer = ({ i18n }: FooterProps) => {
  const links = [
    {
      url: EMAIL_WEBSITE_URL,
      value: i18n._('Website'),
      ariaLabel: i18n._("Visit LessBusy's website"),
    },
    {
      url: EMAIL_GITHUB_URL,
      value: i18n._('Github'),
      ariaLabel: i18n._("Visit LessBusy's GitHub repository"),
    },
    {
      url: EMAIL_USER_GUIDE_URL,
      value: i18n._('User guide'),
      ariaLabel: i18n._("Read LessBusy's user guide"),
    },
    {
      url: EMAIL_API_DOCS_URL,
      value: i18n._('Developers'),
      ariaLabel: i18n._("Visit LessBusy's developer documentation"),
    },
  ].filter((link) => link.url !== '');

  if (links.length === 0 && !EMAIL_LEGAL_NAME) {
    return null;
  }

  return (
    <Container style={footerContainerStyle}>
      {links.length > 0 && (
        <Row>
          {links.map((link) => (
            <Column key={link.ariaLabel}>
              <ShadowText>
                <Link
                  href={link.url}
                  value={link.value}
                  aria-label={link.ariaLabel}
                />
              </ShadowText>
            </Column>
          ))}
        </Row>
      )}
      {EMAIL_LEGAL_NAME && <ShadowText>{EMAIL_LEGAL_NAME}</ShadowText>}
    </Container>
  );
};
