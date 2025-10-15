import React from "react";
import { BaseNode } from "./BaseNode";
import { NodeData } from "../../types";
import { NodeProps } from "reactflow";

interface DataOutputNodeProps extends NodeProps {
  data: NodeData;
}

export const DataOutputNode: React.FC<DataOutputNodeProps> = (props) => {
  return <BaseNode {...props} />;
};
