import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { LessBusyAssistantButton } from '@/lessbusy/components/LessBusyAssistantButton';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';

const openAskAiPage = jest.fn();
jest.mock('@/settings/roles/hooks/useHasPermissionFlag');
jest.mock('@/side-panel/hooks/useOpenAskAiPageInSidePanel', () => ({
  useOpenAskAiPageInSidePanel: () => ({ openAskAiPage }),
}));

describe('Ask LessBusy AI', () => {
  it('does not offer AI to users without permission', () => {
    jest.mocked(useHasPermissionFlag).mockReturnValue(false);
    render(<LessBusyAssistantButton />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('opens the existing side panel without navigating away', async () => {
    jest.mocked(useHasPermissionFlag).mockReturnValue(true);
    render(<LessBusyAssistantButton />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Ask LessBusy AI' }),
    );
    expect(openAskAiPage).toHaveBeenCalledTimes(1);
  });
});
