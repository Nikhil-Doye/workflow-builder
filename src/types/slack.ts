export type SlackOperation =
  | "message"
  | "channel"
  | "user"
  | "file"
  | "reaction"
  | "reminder";

export interface SlackConfig {
  // Operation selection
  operation: SlackOperation;

  // Authentication
  botToken: string;
  appToken?: string; // For socket mode

  // Message operation
  channel?: string;
  text?: string;
  blocks?: any[];
  attachments?: any[];
  threadTs?: string; // For replying to threads
  replyBroadcast?: boolean;

  // Channel operation
  channelName?: string;
  channelPurpose?: string;
  channelTopic?: string;
  isPrivate?: boolean;
  inviteUsers?: string[];

  // User operation
  userId?: string;
  userEmail?: string;
  userPresence?: "auto" | "away";

  // File operation
  fileContent?: string;
  fileName?: string;
  fileType?: string;
  fileTitle?: string;
  fileComment?: string;

  // Reaction operation
  emoji?: string;
  timestamp?: string;

  // Reminder operation
  reminderText?: string;
  reminderTime?: string; // Unix timestamp or natural language
  reminderUser?: string;

  // Advanced options
  parse?: "full" | "none";
  linkNames?: boolean;
  unfurlLinks?: boolean;
  unfurlMedia?: boolean;
  username?: string;
  iconEmoji?: string;
  iconUrl?: string;
  asUser?: boolean;
}

export interface SlackResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    operation: SlackOperation;
    channelId?: string;
    messageTs?: string;
    userId?: string;
    executionTime?: number;
  };
}
