import { GmailOperation, GmailConfig } from "../../types/gmail";

export class GmailService {
  private baseUrl = "https://gmail.googleapis.com/gmail/v1";

  async executeOperation(
    operation: GmailOperation,
    config: GmailConfig
  ): Promise<any> {
    try {
      switch (operation) {
        case GmailOperation.SEND:
          return await this.sendEmail(config);
        case GmailOperation.READ:
          return await this.readEmail(config);
        case GmailOperation.REPLY:
          return await this.replyToEmail(config);
        case GmailOperation.FORWARD:
          return await this.forwardEmail(config);
        case GmailOperation.DRAFT:
          return await this.manageDraft(config);
        case GmailOperation.LABEL:
          return await this.manageLabel(config);
        case GmailOperation.SEARCH:
          return await this.searchEmails(config);
        case GmailOperation.ATTACHMENT:
          return await this.handleAttachment(config);
        default:
          throw new Error(`Unsupported Gmail operation: ${operation}`);
      }
    } catch (error) {
      throw new Error(
        `Gmail operation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async sendEmail(config: GmailConfig): Promise<any> {
    const message = this.createMessage(config);
    return await this.makeRequest(
      "/users/me/messages/send",
      {
        method: "POST",
        body: JSON.stringify({ raw: message }),
      },
      config.accessToken
    );
  }

  private async readEmail(config: GmailConfig): Promise<any> {
    if (config.messageId) {
      return await this.makeRequest(
        `/users/me/messages/${config.messageId}`,
        {
          method: "GET",
        },
        config.accessToken
      );
    }

    // List messages with query
    const params = new URLSearchParams();
    if (config.query) params.append("q", config.query);
    if (config.maxResults)
      params.append("maxResults", config.maxResults.toString());

    return await this.makeRequest(
      `/users/me/messages?${params.toString()}`,
      {
        method: "GET",
      },
      config.accessToken
    );
  }

  private async replyToEmail(config: GmailConfig): Promise<any> {
    const message = this.createMessage(config);
    return await this.makeRequest(
      `/users/me/messages/${config.replyToMessageId}/reply`,
      {
        method: "POST",
        body: JSON.stringify({ raw: message }),
      },
      config.accessToken
    );
  }

  private async forwardEmail(config: GmailConfig): Promise<any> {
    const message = this.createMessage(config);
    return await this.makeRequest(
      `/users/me/messages/${config.messageId}/forward`,
      {
        method: "POST",
        body: JSON.stringify({ raw: message }),
      },
      config.accessToken
    );
  }

  private async manageDraft(config: GmailConfig): Promise<any> {
    if (config.draftId) {
      // Get existing draft
      return await this.makeRequest(
        `/users/me/drafts/${config.draftId}`,
        {
          method: "GET",
        },
        config.accessToken
      );
    }

    // Create new draft
    const message = this.createMessage(config);
    return await this.makeRequest(
      "/users/me/drafts",
      {
        method: "POST",
        body: JSON.stringify({
          message: { raw: message },
        }),
      },
      config.accessToken
    );
  }

  private async manageLabel(config: GmailConfig): Promise<any> {
    if (config.labelId) {
      // Get existing label
      return await this.makeRequest(
        `/users/me/labels/${config.labelId}`,
        {
          method: "GET",
        },
        config.accessToken
      );
    }

    // Create new label
    const labelData = {
      name: config.labelName,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    };

    if (config.labelColor) {
      labelData.color = { textColor: config.labelColor };
    }

    return await this.makeRequest(
      "/users/me/labels",
      {
        method: "POST",
        body: JSON.stringify(labelData),
      },
      config.accessToken
    );
  }

  private async searchEmails(config: GmailConfig): Promise<any> {
    const params = new URLSearchParams();
    if (config.searchQuery) params.append("q", config.searchQuery);
    if (config.maxResults)
      params.append("maxResults", config.maxResults.toString());
    if (config.includeSpamTrash) params.append("includeSpamTrash", "true");

    return await this.makeRequest(
      `/users/me/messages?${params.toString()}`,
      {
        method: "GET",
      },
      config.accessToken
    );
  }

  private async handleAttachment(config: GmailConfig): Promise<any> {
    return await this.makeRequest(
      `/users/me/messages/${config.messageId}/attachments/${config.attachmentId}`,
      {
        method: "GET",
      },
      config.accessToken
    );
  }

  private createMessage(config: GmailConfig): string {
    const headers = [];

    if (config.to) headers.push(`To: ${config.to}`);
    if (config.cc) headers.push(`Cc: ${config.cc}`);
    if (config.bcc) headers.push(`Bcc: ${config.bcc}`);
    if (config.subject) headers.push(`Subject: ${config.subject}`);

    headers.push("Content-Type: text/html; charset=utf-8");
    headers.push(""); // Empty line before body

    const body = config.htmlBody || config.body || "";

    const fullMessage = [...headers, body].join("\n");
    return Buffer.from(fullMessage).toString("base64url");
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit,
    accessToken: string
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gmail API error: ${response.status} ${response.statusText} - ${
          errorData.error?.message || "Unknown error"
        }`
      );
    }

    return await response.json();
  }

  validateConfig(config: GmailConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.accessToken) {
      errors.push("Access token is required");
    }

    if (!config.operation) {
      errors.push("Operation is required");
    }

    switch (config.operation) {
      case GmailOperation.SEND:
        if (!config.to)
          errors.push("Recipient email is required for send operation");
        if (!config.subject)
          errors.push("Subject is required for send operation");
        if (!config.body && !config.htmlBody)
          errors.push("Message body is required for send operation");
        break;
      case GmailOperation.READ:
        if (!config.messageId && !config.query) {
          errors.push(
            "Either message ID or search query is required for read operation"
          );
        }
        break;
      case GmailOperation.REPLY:
        if (!config.replyToMessageId)
          errors.push("Reply to message ID is required for reply operation");
        if (!config.body && !config.htmlBody)
          errors.push("Reply message body is required");
        break;
      case GmailOperation.FORWARD:
        if (!config.messageId)
          errors.push("Message ID is required for forward operation");
        if (!config.to)
          errors.push("Recipient email is required for forward operation");
        break;
      case GmailOperation.DRAFT:
        if (!config.subject)
          errors.push("Subject is required for draft operation");
        break;
      case GmailOperation.LABEL:
        if (!config.labelName && !config.labelId) {
          errors.push(
            "Either label name or label ID is required for label operation"
          );
        }
        break;
      case GmailOperation.SEARCH:
        if (!config.searchQuery)
          errors.push("Search query is required for search operation");
        break;
      case GmailOperation.ATTACHMENT:
        if (!config.messageId)
          errors.push("Message ID is required for attachment operation");
        if (!config.attachmentId)
          errors.push("Attachment ID is required for attachment operation");
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
