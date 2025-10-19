import React, { useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import {
  Search,
  Grid,
  List,
  Brain,
  Globe,
  ArrowRight,
  Database,
  FileText,
  // X, // Removed unused import
  ChevronLeft,
  // ChevronRight, // Removed unused import
  Zap,
  Search as SearchIcon,
} from "lucide-react";

export const NodeLibrary: React.FC = () => {
  const { panelStates, togglePanel } = useWorkflowStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const isCollapsed = panelStates.nodeLibrary.isCollapsed;
  const isHidden = panelStates.nodeLibrary.isHidden;

  if (isHidden) return null;

  const nodeTypesList = [
    {
      type: "dataInput",
      label: "Data Input",
      icon: ArrowRight,
      description: "Start your workflow with data",
      color: "blue",
      category: "Input",
    },
    {
      type: "webScraping",
      label: "Web Scraping",
      icon: Globe,
      description: "Extract content from websites",
      color: "green",
      category: "Data",
    },
    {
      type: "llmTask",
      label: "AI Task",
      icon: Brain,
      description: "Process with AI models",
      color: "purple",
      category: "AI",
    },
    {
      type: "embeddingGenerator",
      label: "Embedding",
      icon: Zap,
      description: "Generate vector embeddings",
      color: "yellow",
      category: "AI",
    },
    {
      type: "similaritySearch",
      label: "Similarity Search",
      icon: SearchIcon,
      description: "Find similar content",
      color: "orange",
      category: "AI",
    },
    {
      type: "structuredOutput",
      label: "Structured Output",
      icon: FileText,
      description: "Format data with schemas",
      color: "indigo",
      category: "Output",
    },
    {
      type: "dataOutput",
      label: "Data Output",
      icon: ArrowRight,
      description: "Export your results",
      color: "gray",
      category: "Output",
    },
    {
      type: "databaseQuery",
      label: "Database Query",
      icon: Database,
      description: "Query database with SQL",
      color: "cyan",
      category: "Database",
    },
    {
      type: "databaseInsert",
      label: "Database Insert",
      icon: Database,
      description: "Insert data into database",
      color: "cyan",
      category: "Database",
    },
    {
      type: "databaseUpdate",
      label: "Database Update",
      icon: Database,
      description: "Update database records",
      color: "cyan",
      category: "Database",
    },
    {
      type: "databaseDelete",
      label: "Database Delete",
      icon: Database,
      description: "Delete database records",
      color: "cyan",
      category: "Database",
    },
  ];

  const categories = [
    { name: "All", count: nodeTypesList.length },
    {
      name: "Input",
      count: nodeTypesList.filter((n) => n.category === "Input").length,
    },
    {
      name: "AI",
      count: nodeTypesList.filter((n) => n.category === "AI").length,
    },
    {
      name: "Data",
      count: nodeTypesList.filter((n) => n.category === "Data").length,
    },
    {
      name: "Database",
      count: nodeTypesList.filter((n) => n.category === "Database").length,
    },
    {
      name: "Output",
      count: nodeTypesList.filter((n) => n.category === "Output").length,
    },
  ];

  const filteredNodes = nodeTypesList.filter(
    (nodeType) =>
      (selectedCategory === "All" || nodeType.category === selectedCategory) &&
      (searchQuery === "" ||
        nodeType.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nodeType.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "border-blue-200 bg-blue-50 hover:bg-blue-100",
      green: "border-green-200 bg-green-50 hover:bg-green-100",
      purple: "border-purple-200 bg-purple-50 hover:bg-purple-100",
      yellow: "border-yellow-200 bg-yellow-50 hover:bg-yellow-100",
      orange: "border-orange-200 bg-orange-50 hover:bg-orange-100",
      indigo: "border-indigo-200 bg-indigo-50 hover:bg-indigo-100",
      gray: "border-gray-200 bg-gray-50 hover:bg-gray-100",
      cyan: "border-cyan-200 bg-cyan-50 hover:bg-cyan-100",
    };
    return colorMap[color] || "border-gray-200 bg-gray-50 hover:bg-gray-100";
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col shadow-lg transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64 lg:w-72"
      }`}
    >
      {/* Header */}
      <div
        className={`border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 ${
          isCollapsed ? "p-2" : "p-4"
        }`}
      >
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          {isCollapsed ? (
            <button
              onClick={() => togglePanel("nodeLibrary")}
              className="w-10 h-10 bg-gradient-to-r from-gray-500 to-blue-500 rounded-xl flex items-center justify-center hover:from-gray-600 hover:to-blue-600 transition-colors"
              title="Expand Node Library"
            >
              <Grid className="w-5 h-5 text-white" />
            </button>
          ) : (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Grid className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Node Library
                  </h3>
                  <p className="text-sm text-gray-600">Drag nodes to canvas</p>
                </div>
              </div>
              <button
                onClick={() => togglePanel("nodeLibrary")}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Collapse panel"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    selectedCategory === category.name
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Node List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div
              className={`space-y-2 ${
                viewMode === "grid" ? "grid grid-cols-1 gap-3" : ""
              }`}
            >
              {filteredNodes.map((nodeType) => {
                const IconComponent = nodeType.icon;
                return (
                  <div
                    key={nodeType.type}
                    className={`group flex items-center space-x-3 p-3 rounded-xl border cursor-move transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 ${getColorClasses(
                      nodeType.color
                    )}`}
                    draggable
                    onDragStart={(event) => onDragStart(event, nodeType.type)}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center">
                        <IconComponent className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium truncate">
                          {nodeType.label}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-white/60 rounded-full">
                          {nodeType.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {nodeType.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
