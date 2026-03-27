import { Inngest } from 'inngest';

export const inngest = new Inngest({ id: 'sys-design-echo' });

// Event type definitions
export type NotionPageUpdatedEvent = {
  name: 'notion/page.updated';
  data: {
    pageId: string;
  };
};
