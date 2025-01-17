import * as React from 'react';

import { AnnotatedSection } from '@/components/ui/annotated';

export default function OrganisationDetailsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <AnnotatedSection
      title="Organisation details"
      description="Basic details about your organisation."
    >
      {children}
    </AnnotatedSection>
  );
}
