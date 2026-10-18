import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LessBusyRecordSummary } from '@/lessbusy/components/LessBusyRecordSummary';
import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';

jest.mock('@/object-record/hooks/useAggregateRecords', () => ({
  useAggregateRecords: jest.fn(),
}));
jest.mock('@/localization/hooks/useNumberFormat', () => ({
  useNumberFormat: () => ({ formatNumber: (value: number) => String(value) }),
}));

const mockAggregate = jest.mocked(useAggregateRecords);
const refetch = jest.fn().mockResolvedValue({});
const renderSummary = () =>
  render(
    <MemoryRouter>
      <LessBusyRecordSummary
        label="Customers"
        destination={{
          id: 'person',
          nameSingular: 'person',
          namePlural: 'people',
          isActive: true,
          path: '/objects/people',
        }}
      />
    </MemoryRouter>,
  );

describe('LessBusy record summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAggregate.mockReturnValue({
      data: {},
      loading: false,
      error: undefined,
      refetch,
    } as unknown as ReturnType<typeof useAggregateRecords>);
  });

  it('does not turn missing data into an invented zero', () => {
    renderSummary();
    expect(screen.getByText('Unavailable')).toBeVisible();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows a real zero and links to the existing record list', () => {
    mockAggregate.mockReturnValue({
      data: { id: { COUNT: 0 } },
      loading: false,
      refetch,
    } as unknown as ReturnType<typeof useAggregateRecords>);
    renderSummary();
    expect(screen.getByText('0')).toBeVisible();
    expect(screen.getByRole('link', { name: 'View records' })).toHaveAttribute(
      'href',
      '/objects/people',
    );
  });

  it('announces loading instead of showing cached totals', () => {
    mockAggregate.mockReturnValue({
      data: { id: { COUNT: 42 } },
      loading: true,
      refetch,
    } as unknown as ReturnType<typeof useAggregateRecords>);
    renderSummary();
    expect(screen.getByText('Loading…')).toBeVisible();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  it('offers retry when the authorized query fails', async () => {
    mockAggregate.mockReturnValue({
      data: {},
      loading: false,
      error: new Error('failed'),
      refetch,
    } as unknown as ReturnType<typeof useAggregateRecords>);
    renderSummary();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load this summary.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
