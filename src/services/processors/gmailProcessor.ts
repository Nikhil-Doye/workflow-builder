import { NodeData } from "../../types";
import { GmailService } from "../gmail/GmailService";
import { GmailOperation } from "../../types/gmail";

async function gmailProcessor(nodeData: NodeData): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const { config } = nodeData;

    if (!config) {
      return {
        success: false,
        error: "Gmail configuration is missing",
      };
    }

    const gmailService = new GmailService();

    // Validate configuration
    const validation = gmailService.validateConfig(config as any);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Configuration validation failed: ${validation.errors.join(
          ", "
        )}`,
      };
    }

    // Execute Gmail operation
    const result = await gmailService.executeOperation(
      config.operation as GmailOperation,
      config as any
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown Gmail operation error",
    };
  }
}

export default gmailProcessor;
