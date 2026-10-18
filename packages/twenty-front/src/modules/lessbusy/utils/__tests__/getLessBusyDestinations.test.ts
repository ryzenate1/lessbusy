import { getLessBusyDestinations } from '@/lessbusy/utils/getLessBusyDestinations';

const objects = [
  {
    id: 'workspace-a-person',
    nameSingular: 'person',
    namePlural: 'people',
    isActive: true,
  },
  {
    id: 'workspace-a-task',
    nameSingular: 'task',
    namePlural: 'tasks',
    isActive: true,
  },
];

describe('LessBusy workflow destinations', () => {
  it('uses actual object routes and includes only explicitly readable objects', () => {
    expect(
      getLessBusyDestinations({
        objects,
        permissions: {
          'workspace-a-person': { canReadObjectRecords: true },
          'workspace-a-task': { canReadObjectRecords: false },
        },
      }),
    ).toEqual([{ ...objects[0], path: '/objects/people' }]);
  });

  it('does not reuse permissions from another workspace or unknown permissions', () => {
    expect(
      getLessBusyDestinations({
        objects,
        permissions: {
          'workspace-b-person': { canReadObjectRecords: true },
        },
      }),
    ).toEqual([]);
  });

  it('omits inactive and unsupported objects even when readable', () => {
    expect(
      getLessBusyDestinations({
        objects: [
          { ...objects[0], isActive: false },
          {
            id: 'product',
            nameSingular: 'product',
            namePlural: 'products',
            isActive: true,
          },
        ],
        permissions: {
          'workspace-a-person': { canReadObjectRecords: true },
          product: { canReadObjectRecords: true },
        },
      }),
    ).toEqual([]);
  });

  it('does not hardcode an object plural or lose workflow ordering', () => {
    const destinations = getLessBusyDestinations({
      objects: [
        { ...objects[0], namePlural: 'contacts' },
        objects[1],
      ].reverse(),
      permissions: {
        'workspace-a-person': { canReadObjectRecords: true },
        'workspace-a-task': { canReadObjectRecords: true },
      },
    });
    expect(destinations.map(({ path }) => path)).toEqual([
      '/objects/contacts',
      '/objects/tasks',
    ]);
  });
});
