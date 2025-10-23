import { SlackConfig, SlackResponse, SlackOperation } from "../../types/slack";

export class SlackService {
  private baseUrl = "https://slack.com/api";

  /**
   * Execute a Slack operation based on configuration
   */
  async executeOperation(config: SlackConfig): Promise<SlackResponse> {
    try {
      // Validate required fields
      if (!config.operation) {
        throw new Error("Slack operation is required");
      }

      if (!config.botToken) {
        throw new Error("Slack bot token is required");
      }

      // Execute operation based on type
      switch (config.operation) {
        case "message":
          return await this.sendMessage(config);
        case "channel":
          return await this.manageChannel(config);
        case "user":
          return await this.manageUser(config);
        case "file":
          return await this.manageFile(config);
        case "reaction":
          return await this.manageReaction(config);
        case "reminder":
          return await this.setReminder(config);
        default:
          throw new Error(`Unsupported Slack operation: ${config.operation}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          operation: config.operation,
        },
      };
    }
  }

  /**
   * Send a message to a Slack channel or user
   */
  private async sendMessage(config: SlackConfig): Promise<SlackResponse> {
    const payload: any = {
      channel: config.channel,
      text: config.text,
      parse: config.parse || "full",
      link_names: config.linkNames || false,
      unfurl_links: config.unfurlLinks || false,
      unfurl_media: config.unfurlMedia || false,
    };

    // Add optional fields
    if (config.blocks) payload.blocks = config.blocks;
    if (config.attachments) payload.attachments = config.attachments;
    if (config.threadTs) payload.thread_ts = config.threadTs;
    if (config.replyBroadcast) payload.reply_broadcast = config.replyBroadcast;
    if (config.username) payload.username = config.username;
    if (config.iconEmoji) payload.icon_emoji = config.iconEmoji;
    if (config.iconUrl) payload.icon_url = config.iconUrl;
    if (config.asUser) payload.as_user = config.asUser;

    const response = await this.makeRequest(
      "chat.postMessage",
      payload,
      config.botToken
    );

    return {
      success: response.ok,
      data: response,
      error: response.error,
      metadata: {
        operation: "message",
        channelId: response.channel,
        messageTs: response.ts,
        executionTime: Date.now(),
      },
    };
  }

  /**
   * Create or manage a Slack channel
   */
  private async manageChannel(config: SlackConfig): Promise<SlackResponse> {
    const payload: any = {
      name: config.channelName,
    };

    if (config.channelPurpose) payload.purpose = config.channelPurpose;
    if (config.channelTopic) payload.topic = config.channelTopic;
    if (config.isPrivate) payload.is_private = config.isPrivate;
    if (config.inviteUsers) payload.invite_users = config.inviteUsers.join(",");

    const response = await this.makeRequest(
      "conversations.create",
      payload,
      config.botToken
    );

    return {
      success: response.ok,
      data: response,
      error: response.error,
      metadata: {
        operation: "channel",
        channelId: response.channel?.id,
        executionTime: Date.now(),
      },
    };
  }

  /**
   * Manage user operations
   */
  private async manageUser(config: SlackConfig): Promise<SlackResponse> {
    let endpoint = "";
    let payload: any = {};

    if (config.userId) {
      endpoint = "users.info";
      payload.user = config.userId;
    } else if (config.userEmail) {
      endpoint = "users.lookupByEmail";
      payload.email = config.userEmail;
    } else {
      throw new Error(
        "Either userId or userEmail is required for user operations"
      );
    }

    const response = await this.makeRequest(endpoint, payload, config.botToken);

    return {
      success: response.ok,
      data: response,
      error: response.error,
      metadata: {
        operation: "user",
        userId: response.user?.id,
        executionTime: Date.now(),
      },
    };
  }

  /**
   * Upload or manage files
   */
  private async manageFile(config: SlackConfig): Promise<SlackResponse> {
    const payload: any = {
      content: config.fileContent,
      filename: config.fileName,
      filetype: config.fileType,
    };

    if (config.channel) payload.channels = config.channel;
    if (config.fileTitle) payload.title = config.fileTitle;
    if (config.fileComment) payload.initial_comment = config.fileComment;

    const response = await this.makeRequest(
      "files.upload",
      payload,
      config.botToken
    );

    return {
      success: response.ok,
      data: response,
      error: response.error,
      metadata: {
        operation: "file",
        channelId: response.file?.channels?.[0],
        executionTime: Date.now(),
      },
    };
  }

  /**
   * Add or remove reactions
   */
  private async manageReaction(config: SlackConfig): Promise<SlackResponse> {
    if (!config.channel || !config.timestamp || !config.emoji) {
      throw new Error(
        "Channel, timestamp, and emoji are required for reaction operations"
      );
    }

    const payload = {
      channel: config.channel,
      timestamp: config.timestamp,
      name: config.emoji.replace(/:/g, ""), // Remove colons from emoji name
    };

    const response = await this.makeRequest(
      "reactions.add",
      payload,
      config.botToken
    );

    return {
      success: response.ok,
      data: response,
      error: response.error,
      metadata: {
        operation: "reaction",
        channelId: config.channel,
        messageTs: config.timestamp,
        executionTime: Date.now(),
      },
    };
  }

  /**
   * Set a reminder
   */
  private async setReminder(config: SlackConfig): Promise<SlackResponse> {
    if (!config.reminderText || !config.reminderTime) {
      throw new Error("Reminder text and time are required");
    }

    const payload: any = {
      text: config.reminderText,
      time: config.reminderTime,
    };

    if (config.reminderUser) payload.user = config.reminderUser;

    const response = await this.makeRequest(
      "reminders.add",
      payload,
      config.botToken
    );

    return {
      success: response.ok,
      data: response,
      error: response.error,
      metadata: {
        operation: "reminder",
        executionTime: Date.now(),
      },
    };
  }

  /**
   * Make a request to the Slack API
   */
  private async makeRequest(
    endpoint: string,
    payload: any,
    token: string
  ): Promise<any> {
    const url = `${this.baseUrl}/${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Validate configuration for specific operation
   */
  validateConfig(config: SlackConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.operation) {
      errors.push("Operation is required");
    }

    if (!config.botToken) {
      errors.push("Bot token is required");
    }

    // Operation-specific validation
    switch (config.operation) {
      case "message":
        if (!config.channel) {
          errors.push("Channel is required for message operation");
        }
        if (!config.text && !config.blocks) {
          errors.push("Text or blocks are required for message operation");
        }
        break;

      case "channel":
        if (!config.channelName) {
          errors.push("Channel name is required for channel operation");
        }
        break;

      case "user":
        if (!config.userId && !config.userEmail) {
          errors.push(
            "Either userId or userEmail is required for user operation"
          );
        }
        break;

      case "file":
        if (!config.fileContent) {
          errors.push("File content is required for file operation");
        }
        if (!config.fileName) {
          errors.push("File name is required for file operation");
        }
        break;

      case "reaction":
        if (!config.channel) {
          errors.push("Channel is required for reaction operation");
        }
        if (!config.timestamp) {
          errors.push("Timestamp is required for reaction operation");
        }
        if (!config.emoji) {
          errors.push("Emoji is required for reaction operation");
        }
        break;

      case "reminder":
        if (!config.reminderText) {
          errors.push("Reminder text is required for reminder operation");
        }
        if (!config.reminderTime) {
          errors.push("Reminder time is required for reminder operation");
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
