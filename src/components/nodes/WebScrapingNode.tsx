import React from "react";
import { BaseNode } from "./BaseNode";
import { NodeData } from "../../types";
import { NodeProps } from "reactflow";

interface WebScrapingNodeProps extends NodeProps {
  data: NodeData;
}

export const WebScrapingNode: React.FC<WebScrapingNodeProps> = (props) => {
  return <BaseNode {...props} />;
};
