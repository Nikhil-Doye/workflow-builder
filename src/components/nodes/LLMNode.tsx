import React from "react";
import { BaseNode } from "./BaseNode";
import { NodeData } from "../../types";
import { NodeProps } from "reactflow";

interface LLMNodeProps extends NodeProps {
  data: NodeData;
}

export const LLMNode: React.FC<LLMNodeProps> = (props) => {
  return <BaseNode {...props} />;
};
