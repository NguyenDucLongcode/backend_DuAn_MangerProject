// src/email/interfaces/email-options.interface.ts
export interface EmailAttachment {
  filename: string;
  path: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
  attachments?: any[];
}
