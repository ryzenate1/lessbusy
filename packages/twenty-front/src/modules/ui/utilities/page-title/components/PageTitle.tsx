import { Helmet } from '@dr.pogodin/react-helmet';

import { APP_NAME } from '~/config/branding';
import { useWorkspaceSurface } from '@/ui/layout/hooks/useWorkspaceSurface';

type PageTitleProps = {
  title: string;
};

export const PageTitle = (props: PageTitleProps) => {
  const workspaceSurface = useWorkspaceSurface();

  if (workspaceSurface.type === 'side-panel') {
    return null;
  }

  const hasAppName = props.title.includes(APP_NAME);

  return (
    <Helmet>
      <title>
        {hasAppName ? props.title : `${props.title} | ${APP_NAME}`}
      </title>
    </Helmet>
  );
};
