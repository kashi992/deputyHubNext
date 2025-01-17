'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { MessageCircleIcon } from 'lucide-react';

import { FeedbackModal } from '@/components/dashboard/feedback-modal';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  type SidebarGroupProps
} from '@/components/ui/sidebar';

export type NavSupportProps = SidebarGroupProps;

export function NavSupport({ ...other }: NavSupportProps): React.JSX.Element {
  const handleShowFeedbackModal = (): void => {
    NiceModal.show(FeedbackModal);
  };
  return (
    <SidebarGroup {...other}>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            type="button"
            tooltip="Feedback"
            className="text-muted-foreground"
            onClick={handleShowFeedbackModal}
          >
            <MessageCircleIcon className="size-4 shrink-0" />
            <span>Feedback</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
