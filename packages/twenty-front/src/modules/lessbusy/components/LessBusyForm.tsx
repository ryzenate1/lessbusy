import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme';

export const LessBusyForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin: 0 auto;
  max-width: 1000px;
  label { display: flex; flex-direction: column; gap: 8px; }
  input, select, textarea {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 8px;
    box-sizing: border-box;
    color: ${themeCssVariables.font.color.primary};
    font: inherit;
    min-height: 44px;
    padding: 10px 12px;
    width: 100%;
  }
  input[type='checkbox'] { width: 20px; min-height: 20px; }
  fieldset { border: 1px solid ${themeCssVariables.border.color.medium}; border-radius: 12px; display: grid; gap: 16px; padding: 20px; }
  legend { padding: 0 8px; }
  [data-row] { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr)); }
  [data-confirmation] { align-items: center; flex-direction: row; }
  button { min-height: 44px; }
`;
