import React from "react";
import { BaseNode } from "./BaseNode";
import { NodeData } from "../../types";
import { NodeProps } from "reactflow";

interface DataInputNodeProps extends NodeProps {
  data: NodeData;
}

export const DataInputNode: React.FC<DataInputNodeProps> = (props) => {
  return <BaseNode {...props} />;
};
