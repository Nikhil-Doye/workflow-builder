export enum DiscordOperation {
  MESSAGE = "message",
  CHANNEL = "channel",
  USER = "user",
  ROLE = "role",
  REACTION = "reaction",
  VOICE = "voice",
  WEBHOOK = "webhook",
}

export interface DiscordConfig {
  botToken: string;
  operation: DiscordOperation;
  label: string;

  // Message operations
  channelId?: string;
  message?: string;
  embed?: any;

  // Channel operations
  channelName?: string;
  channelType?: "text" | "voice" | "category";
  channelTopic?: string;

  // User operations
  userId?: string;
  username?: string;
  nickname?: string;

  // Role operations
  roleId?: string;
  roleName?: string;
  roleColor?: string;
  rolePermissions?: string;

  // Reaction operations
  messageId?: string;
  emoji?: string;

  // Voice operations
  voiceChannelId?: string;
  action?: "join" | "leave" | "mute" | "unmute";

  // Webhook operations
  webhookUrl?: string;
  webhookName?: string;
  webhookAvatar?: string;
}
