export enum GmailOperation {
  SEND = "send",
  READ = "read",
  REPLY = "reply",
  FORWARD = "forward",
  DRAFT = "draft",
  LABEL = "label",
  SEARCH = "search",
  ATTACHMENT = "attachment",
}

export interface GmailConfig {
  accessToken: string;
  operation: GmailOperation;
  label: string;

  // Send operations
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  htmlBody?: string;

  // Read operations
  messageId?: string;
  query?: string;
  maxResults?: number;

  // Reply/Forward operations
  threadId?: string;
  replyToMessageId?: string;

  // Draft operations
  draftId?: string;

  // Label operations
  labelName?: string;
  labelId?: string;
  labelColor?: string;

  // Search operations
  searchQuery?: string;
  includeSpamTrash?: boolean;

  // Attachment operations
  attachmentId?: string;
  filename?: string;
  mimeType?: string;
}
