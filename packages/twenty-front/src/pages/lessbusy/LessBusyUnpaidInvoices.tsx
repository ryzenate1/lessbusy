import { t } from '@lingui/core/macro';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyUnpaidInvoices as UnpaidInvoices } from '@/lessbusy/components/LessBusyUnpaidInvoices';
import { LessBusyContent, LessBusyDescription, LessBusySection } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

export const LessBusyUnpaidInvoices = () => <PageCardLayout header={<PageCardHeader title={t`Unpaid invoices`} />}><LessBusyContent><LessBusySection><h1>{t`Keep payments moving.`}</h1><LessBusyDescription>{t`Review finalized invoices awaiting payment, with overdue balances first. Open an invoice to record a received payment or download its PDF.`}</LessBusyDescription></LessBusySection><LessBusySection><LessBusyObjectGate objectName="lbInvoice"><UnpaidInvoices /></LessBusyObjectGate></LessBusySection></LessBusyContent></PageCardLayout>;
