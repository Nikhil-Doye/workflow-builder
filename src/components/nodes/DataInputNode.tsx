import React, { useState, useRef } from "react";
import { BaseNode } from "./BaseNode";
import { NodeData } from "../../types";
import { NodeProps } from "reactflow";
import { Upload, FileText, X } from "lucide-react";
import {
  processPDF,
  validatePDFFile,
  getPDFInfo,
} from "../../services/pdfService";

interface DataInputNodeProps extends NodeProps {
  data: NodeData;
}

export const DataInputNode: React.FC<DataInputNodeProps> = (props) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);

    try {
      // Process PDF file
      const result = await processPDF({ file, extractText: true });

      if (result.success && result.data?.text) {
        // Update the node's output with the extracted text
        props.data.outputs = [
          {
            output: result.data.text,
            metadata: result.data.metadata,
          },
        ];
      } else {
        alert(result.error || "Failed to process PDF");
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
      alert("Error processing PDF file");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    props.data.outputs = [];
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // If it's a PDF data type, show file upload interface
  if (props.data.config?.dataType === "pdf") {
    return (
      <div className="min-w-[280px] bg-white rounded-2xl border-2 border-blue-200 shadow-lg">
        {/* Header */}
        <div className="p-4 pb-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {props.data.label}
              </h3>
              <p className="text-xs text-gray-500">PDF Input</p>
            </div>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="p-4">
          {!uploadedFile ? (
            <div
              onClick={handleUploadClick}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Click to upload PDF</p>
              <p className="text-xs text-gray-500">or drag and drop</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {uploadedFile.name}
                  </span>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-green-600">
                {getPDFInfo(uploadedFile).size}
                {isProcessing && " • Processing..."}
              </div>
              {props.data.outputs.length > 0 && (
                <div className="mt-2 text-xs text-green-700">
                  ✓ Text extracted successfully
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Handle */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="w-4 h-4 border-2 border-white bg-gray-400 hover:bg-gray-500 transition-colors rounded-full" />
        </div>
      </div>
    );
  }

  // For other data types, use the standard BaseNode
  return <BaseNode {...props} />;
};
