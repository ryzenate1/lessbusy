import { type ReactNode } from 'react';
import { t } from '@lingui/core/macro';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { LessBusyDescription, LessBusySection } from '@/lessbusy/components/LessBusyStyles';

export const LessBusyObjectGate = ({ objectName, children }: { objectName: string; children: ReactNode }) => {
  const destinations = useLessBusyDestinations();
  return destinations.some((destination) => destination.nameSingular === objectName) ? <>{children}</> : <LessBusySection><LessBusyDescription>{t`This module is not available in your current workspace access. Ask your administrator to enable the LessBusy Business application and grant the appropriate role.`}</LessBusyDescription></LessBusySection>;
};
