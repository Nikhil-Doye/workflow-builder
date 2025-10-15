import React from "react";
import { BaseNode } from "./BaseNode";
import { NodeData } from "../../types";
import { NodeProps } from "reactflow";

interface SimilaritySearchNodeProps extends NodeProps {
  data: NodeData;
}

export const SimilaritySearchNode: React.FC<SimilaritySearchNodeProps> = (
  props
) => {
  return <BaseNode {...props} />;
};
