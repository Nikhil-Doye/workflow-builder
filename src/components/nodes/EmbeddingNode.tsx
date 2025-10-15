import React from "react";
import { BaseNode } from "./BaseNode";
import { NodeData } from "../../types";
import { NodeProps } from "reactflow";

interface EmbeddingNodeProps extends NodeProps {
  data: NodeData;
}

export const EmbeddingNode: React.FC<EmbeddingNodeProps> = (props) => {
  return <BaseNode {...props} />;
};
