import React from "react";
import { BaseNode } from "./BaseNode";
import { NodeData } from "../../types";
import { NodeProps } from "reactflow";

interface StructuredOutputNodeProps extends NodeProps {
  data: NodeData;
}

export const StructuredOutputNode: React.FC<StructuredOutputNodeProps> = (
  props
) => {
  return <BaseNode {...props} />;
};
