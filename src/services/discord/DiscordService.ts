import { DiscordOperation, DiscordConfig } from "../../types/discord";

export class DiscordService {
  private baseUrl = "https://discord.com/api/v10";

  async executeOperation(
    operation: DiscordOperation,
    config: DiscordConfig
  ): Promise<any> {
    try {
      switch (operation) {
        case DiscordOperation.MESSAGE:
          return await this.sendMessage(config);
        case DiscordOperation.CHANNEL:
          return await this.manageChannel(config);
        case DiscordOperation.USER:
          return await this.manageUser(config);
        case DiscordOperation.ROLE:
          return await this.manageRole(config);
        case DiscordOperation.REACTION:
          return await this.manageReaction(config);
        case DiscordOperation.VOICE:
          return await this.manageVoice(config);
        case DiscordOperation.WEBHOOK:
          return await this.manageWebhook(config);
        default:
          throw new Error(`Unsupported Discord operation: ${operation}`);
      }
    } catch (error) {
      throw new Error(
        `Discord operation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async sendMessage(config: DiscordConfig): Promise<any> {
    const payload: any = {
      content: config.message,
    };

    if (config.embed) {
      payload.embeds = [config.embed];
    }

    return await this.makeRequest(
      `/channels/${config.channelId}/messages`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      config.botToken
    );
  }

  private async manageChannel(config: DiscordConfig): Promise<any> {
    const payload: any = {
      name: config.channelName,
      type:
        config.channelType === "text"
          ? 0
          : config.channelType === "voice"
          ? 2
          : 4,
    };

    if (config.channelTopic) {
      payload.topic = config.channelTopic;
    }

    return await this.makeRequest(
      `/guilds/${config.channelId}/channels`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      config.botToken
    );
  }

  private async manageUser(config: DiscordConfig): Promise<any> {
    if (config.nickname) {
      return await this.makeRequest(
        `/guilds/${config.channelId}/members/${config.userId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ nick: config.nickname }),
        },
        config.botToken
      );
    }

    // Get user info
    return await this.makeRequest(
      `/users/${config.userId}`,
      {
        method: "GET",
      },
      config.botToken
    );
  }

  private async manageRole(config: DiscordConfig): Promise<any> {
    const payload: any = {
      name: config.roleName,
    };

    if (config.roleColor) {
      payload.color = parseInt(config.roleColor.replace("#", ""), 16);
    }

    if (config.rolePermissions) {
      payload.permissions = config.rolePermissions;
    }

    if (config.roleId) {
      return await this.makeRequest(
        `/guilds/${config.channelId}/roles/${config.roleId}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
        config.botToken
      );
    } else {
      return await this.makeRequest(
        `/guilds/${config.channelId}/roles`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        config.botToken
      );
    }
  }

  private async manageReaction(config: DiscordConfig): Promise<any> {
    const emoji = encodeURIComponent(config.emoji || "👍");

    return await this.makeRequest(
      `/channels/${config.channelId}/messages/${config.messageId}/reactions/${emoji}`,
      {
        method: "PUT",
      },
      config.botToken
    );
  }

  private async manageVoice(config: DiscordConfig): Promise<any> {
    // Voice operations are complex and typically require voice connection
    // This is a placeholder for basic voice channel management
    return await this.makeRequest(
      `/channels/${config.voiceChannelId}`,
      {
        method: "GET",
      },
      config.botToken
    );
  }

  private async manageWebhook(config: DiscordConfig): Promise<any> {
    if (config.webhookUrl) {
      // Use webhook URL directly
      const payload = {
        content: config.message,
        username: config.webhookName,
        avatar_url: config.webhookAvatar,
      };

      const response = await fetch(config.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.statusText}`);
      }

      return await response.json();
    }

    // Create webhook
    const payload = {
      name: config.webhookName,
      avatar: config.webhookAvatar,
    };

    return await this.makeRequest(
      `/channels/${config.channelId}/webhooks`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      config.botToken
    );
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit,
    botToken: string
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
        "User-Agent": "DiscordBot (https://github.com/your-bot, 1.0.0)",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Discord API error: ${response.status} ${response.statusText} - ${
          errorData.message || "Unknown error"
        }`
      );
    }

    return await response.json();
  }

  validateConfig(config: DiscordConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.botToken) {
      errors.push("Bot token is required");
    }

    if (!config.operation) {
      errors.push("Operation is required");
    }

    switch (config.operation) {
      case DiscordOperation.MESSAGE:
        if (!config.channelId)
          errors.push("Channel ID is required for message operations");
        if (!config.message) errors.push("Message content is required");
        break;
      case DiscordOperation.CHANNEL:
        if (!config.channelName)
          errors.push("Channel name is required for channel operations");
        break;
      case DiscordOperation.USER:
        if (!config.userId)
          errors.push("User ID is required for user operations");
        break;
      case DiscordOperation.ROLE:
        if (!config.roleName)
          errors.push("Role name is required for role operations");
        break;
      case DiscordOperation.REACTION:
        if (!config.messageId)
          errors.push("Message ID is required for reaction operations");
        if (!config.emoji)
          errors.push("Emoji is required for reaction operations");
        break;
      case DiscordOperation.VOICE:
        if (!config.voiceChannelId)
          errors.push("Voice channel ID is required for voice operations");
        break;
      case DiscordOperation.WEBHOOK:
        if (!config.webhookUrl && !config.channelId) {
          errors.push(
            "Either webhook URL or channel ID is required for webhook operations"
          );
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
