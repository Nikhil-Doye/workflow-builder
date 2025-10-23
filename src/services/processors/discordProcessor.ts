import { NodeData } from "../../types";
import { DiscordService } from "../discord/DiscordService";
import { DiscordOperation } from "../../types/discord";

async function discordProcessor(nodeData: NodeData): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const { config } = nodeData;

    if (!config) {
      return {
        success: false,
        error: "Discord configuration is missing",
      };
    }

    const discordService = new DiscordService();

    // Validate configuration
    const validation = discordService.validateConfig(config as any);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Configuration validation failed: ${validation.errors.join(
          ", "
        )}`,
      };
    }

    // Execute Discord operation
    const result = await discordService.executeOperation(
      config.operation as DiscordOperation,
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
          : "Unknown Discord operation error",
    };
  }
}

export default discordProcessor;
