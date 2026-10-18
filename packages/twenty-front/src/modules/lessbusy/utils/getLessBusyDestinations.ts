import { getAppPath } from 'twenty-shared/utils';
import { AppPath } from 'twenty-shared/types';

type DestinationObject = {
  id: string;
  nameSingular: string;
  namePlural: string;
  isActive: boolean;
};

type DestinationPermissions = Record<
  string,
  { canReadObjectRecords: boolean } | undefined
>;

export const LESSBUSY_OVERVIEW_PATH = '/overview';

export const LESSBUSY_WORKFLOW_OBJECTS = [
  'person',
  'company',
  'opportunity',
  'task',
  'note',
  'lbLead',
  'lbProduct',
  'lbProductVariant',
  'lbWarehouse',
  'lbStockBalance',
  'lbStockReservation',
  'lbQuotation',
  'lbSalesOrder',
  'lbInvoice',
  'lbPayment',
  'lbBusinessProfile',
] as const;

export type LessBusyDestination = Omit<DestinationObject, 'nameSingular'> & {
  nameSingular: (typeof LESSBUSY_WORKFLOW_OBJECTS)[number];
  path: string;
};

export const getLessBusyDestinations = ({
  objects,
  permissions,
}: {
  objects: DestinationObject[];
  permissions: DestinationPermissions;
}): LessBusyDestination[] =>
  LESSBUSY_WORKFLOW_OBJECTS.flatMap((nameSingular) => {
    const object = objects.find(
      (candidate) => candidate.nameSingular === nameSingular,
    );

    if (!object?.isActive || !permissions[object.id]?.canReadObjectRecords) {
      return [];
    }

    return [
      {
        ...object,
        nameSingular,
        path: getAppPath(AppPath.RecordIndexPage, {
          objectNamePlural: object.namePlural,
        }),
      },
    ];
  });
