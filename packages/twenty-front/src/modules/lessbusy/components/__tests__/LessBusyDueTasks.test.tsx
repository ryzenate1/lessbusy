import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LessBusyDueTasks } from '@/lessbusy/components/LessBusyDueTasks';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

jest.mock('@/object-record/hooks/useFindManyRecords', () => ({
  useFindManyRecords: jest.fn(),
}));
const mockFindMany = jest.mocked(useFindManyRecords);
const refetch = jest.fn().mockResolvedValue({});
const renderTasks = () =>
  render(
    <MemoryRouter>
      <LessBusyDueTasks />
    </MemoryRouter>,
  );

describe('LessBusy due tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindMany.mockReturnValue({
      records: [],
      loading: false,
      refetch,
    } as unknown as ReturnType<typeof useFindManyRecords>);
  });

  it('queries only the earliest five incomplete tasks already due', () => {
    renderTasks();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        objectNameSingular: 'task',
        limit: 5,
        recordGqlFields: { id: true, title: true, dueAt: true },
        orderBy: [{ dueAt: 'AscNullsLast' }],
        filter: {
          and: [
            { dueAt: { lte: expect.any(String) } },
            { status: { in: ['TODO', 'IN_PROGRESS'] } },
          ],
        },
      }),
    );
    expect(screen.getByText(/No overdue tasks/)).toBeVisible();
  });

  it('opens a real record rather than a made-up destination', () => {
    mockFindMany.mockReturnValue({
      records: [
        {
          id: 'task-1',
          title: 'Follow up on the quotation',
          dueAt: '2026-10-16T12:00:00Z',
        },
      ],
      loading: false,
      refetch,
    } as unknown as ReturnType<typeof useFindManyRecords>);
    renderTasks();
    expect(
      screen.getByRole('link', { name: /Follow up on the quotation/ }),
    ).toHaveAttribute('href', '/object/task/task-1');
  });

  it('shows an error and supports retry', async () => {
    mockFindMany.mockReturnValue({
      records: [],
      loading: false,
      error: new Error('failed'),
      refetch,
    } as unknown as ReturnType<typeof useFindManyRecords>);
    renderTasks();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load due tasks.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('announces loading without claiming that there are no due tasks', () => {
    mockFindMany.mockReturnValue({
      records: [],
      loading: true,
      refetch,
    } as unknown as ReturnType<typeof useFindManyRecords>);
    renderTasks();
    expect(screen.getByRole('status')).toHaveTextContent('Loading due tasks…');
    expect(screen.queryByText(/No overdue tasks/)).not.toBeInTheDocument();
  });
});
