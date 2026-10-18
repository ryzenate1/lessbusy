import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';
import { themeCssVariables } from 'twenty-ui/theme';

export const LessBusyContent = styled.main`
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font-size: 16px;
  line-height: 1.6;
  overflow: auto;
  padding: clamp(20px, 4vw, 48px);
  width: 100%;

  h1 {
    font-size: 32px;
    font-weight: 600;
    letter-spacing: -1px;
    line-height: 1.2;
    margin: 0 0 12px;
  }
  h2 {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px;
  }
  p {
    margin: 0;
  }
  button,
  a {
    font: inherit;
  }
  a:focus-visible,
  button:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: 3px;
  }
`;

export const LessBusySection = styled.section`
  margin: 0 auto 32px;
  max-width: 1200px;
`;

export const LessBusyDescription = styled.p`
  color: ${themeCssVariables.font.color.secondary};
`;

export const LessBusyGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr));
`;

export const LessBusySummary = styled.article`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 12px;
  padding: 24px;

  strong {
    display: block;
    font-size: 32px;
    font-weight: 600;
    line-height: 1.5;
    margin: 8px 0;
  }
`;

export const LessBusyLink = styled(Link)`
  align-items: center;
  color: ${themeCssVariables.font.color.primary};
  display: inline-flex;
  gap: 8px;
  min-height: 44px;
  text-decoration: none;

  &:hover {
    color: ${themeCssVariables.color.blue};
    text-decoration: underline;
  }
`;

export const LessBusyActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin-top: 16px;
`;

export const LessBusyRetry = styled.button`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 8px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  min-height: 44px;
  padding: 0 16px;
`;

export const LessBusyTaskList = styled.ul`
  list-style: none;
  margin: 16px 0 0;
  padding: 0;

  li {
    border-bottom: 1px solid ${themeCssVariables.border.color.light};
    padding: 12px 0;
  }
  a {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    overflow-wrap: anywhere;
  }
  time {
    color: ${themeCssVariables.font.color.secondary};
    flex-shrink: 0;
  }

  @media (max-width: 760px) {
    a {
      align-items: flex-start;
      flex-direction: column;
      gap: 4px;
    }
  }
`;
