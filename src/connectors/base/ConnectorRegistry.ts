import { BaseConnector } from "./BaseConnector";

export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private connectors: Map<string, BaseConnector> = new Map();

  private constructor() {}

  static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }

  registerConnector(id: string, connector: BaseConnector): void {
    this.connectors.set(id, connector);
  }

  getConnector(id: string): BaseConnector | undefined {
    return this.connectors.get(id);
  }

  getAllConnectors(): Map<string, BaseConnector> {
    return new Map(this.connectors);
  }

  removeConnector(id: string): boolean {
    return this.connectors.delete(id);
  }

  clear(): void {
    this.connectors.clear();
  }

  getConnectorTypes(): string[] {
    const types = new Set<string>();
    this.connectors.forEach((connector) => {
      types.add(
        connector.constructor.name.replace("Connector", "").toLowerCase()
      );
    });
    return Array.from(types);
  }
}

export const connectorRegistry = ConnectorRegistry.getInstance();
