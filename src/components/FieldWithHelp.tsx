import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { getFieldConfig } from "../config/fieldConfigs";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface FieldWithHelpProps {
  fieldName: string;
  value: any;
  onChange: (value: any) => void;
  type: string;
  options?: string[];
  multiple?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  nodeType?: string;
}

export const FieldWithHelp: React.FC<FieldWithHelpProps> = ({
  fieldName,
  value,
  onChange,
  type,
  options = [],
  multiple = false,
  placeholder,
  min,
  max,
  step,
  className = "",
  nodeType,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const fieldConfig = getFieldConfig(fieldName, nodeType);

  if (!fieldConfig) {
    // Fallback for unknown fields
    return (
      <div className={`field-group ${className}`}>
        <label className="field-label">
          {fieldName}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="help-icon ml-1"
            title="Get help with this field"
            aria-label={`Get help for ${fieldName}`}
          >
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </button>
        </label>
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="field-input"
          placeholder={placeholder}
        />
      </div>
    );
  }

  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="field-input"
            placeholder={placeholder || fieldConfig.examples[0]}
            rows={4}
          />
        );

      case "select":
        if (multiple) {
          return (
            <div className="space-y-2">
              {options.map((option) => (
                <label key={option} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) && value.includes(option)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        onChange([...currentValues, option]);
                      } else {
                        onChange(
                          currentValues.filter((v: string) => v !== option)
                        );
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          );
        }

        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger className="field-input">
              <SelectValue
                placeholder={placeholder || fieldConfig.examples[0]}
              />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "checkbox":
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">{fieldConfig.userFriendlyName}</span>
          </label>
        );

      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="field-input"
            placeholder={placeholder || fieldConfig.examples[0]}
            min={min}
            max={max}
            step={step}
          />
        );

      default:
        return (
          <Input
            type={type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="field-input"
            placeholder={placeholder || fieldConfig.examples[0]}
          />
        );
    }
  };

  return (
    <div className={`field-group ${className}`}>
      <label className="field-label">
        <span className="user-friendly-name">
          {fieldConfig.userFriendlyName}
        </span>
        <span className="technical-name">({fieldConfig.technicalName})</span>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="help-icon ml-1"
          title="Get help with this field"
          aria-label={`Get help for ${fieldConfig.userFriendlyName}`}
        >
          <HelpCircle className="w-4 h-4 text-gray-400 hover:text-blue-500" />
        </button>
      </label>

      {showHelp && (
        <div className="help-panel mb-2 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-700 mb-2">
            {fieldConfig.helpText}
          </div>
          {fieldConfig.examples.length > 0 && (
            <div className="text-xs text-gray-600">
              <strong>Examples:</strong>
              <ul className="list-disc list-inside mt-1">
                {fieldConfig.examples.map((example, index) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {renderInput()}
    </div>
  );
};
