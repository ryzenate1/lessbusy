import { t } from '@lingui/core/macro';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { LessBusyLink } from '@/lessbusy/components/LessBusyStyles';

type LessBusyRecordActionsProps = { objectNameSingular: string };

export const LessBusyRecordActions = ({ objectNameSingular }: LessBusyRecordActionsProps) => {
  const destinations = useLessBusyDestinations();
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const destination = destinations.find((candidate) => candidate.nameSingular === objectNameSingular);
  if (!destination || !objectPermissionsByObjectMetadataId[destination.id]?.canUpdateObjectRecords) return null;
  const actions: Record<string, { path: string; label: string }> = {
    lbProduct: { path: '/products/new', label: t`Add product or service` },
    lbProductVariant: { path: '/products', label: t`Manage product options` },
    lbLead: { path: '/business/leads/new', label: t`Add a lead` },
    lbInvoice: { path: '/business/new/invoice', label: t`Create invoice` },
    lbQuotation: { path: '/business/new/quotation', label: t`Create quotation` },
    lbSalesOrder: { path: '/business/new/order', label: t`Create order` },
    lbStockBalance: { path: '/business/inventory', label: t`Record stock change` },
    lbStockReservation: { path: '/business/inventory', label: t`Manage reservations` },
    lbBusinessProfile: { path: '/business/settings', label: t`Business settings` },
  };
  const action = actions[objectNameSingular];
  return action ? <LessBusyLink to={action.path}>{action.label}</LessBusyLink> : null;
};
