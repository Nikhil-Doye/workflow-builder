import React, { useState, useRef, useEffect, useCallback } from "react";
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
  const [focusedNodeIndex, setFocusedNodeIndex] = useState(-1);
  const [focusedCategoryIndex, setFocusedCategoryIndex] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  // Refs for focus management
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nodeListRef = useRef<HTMLDivElement>(null);
  const categoryButtonsRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

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

  // Accessibility functions
  const announceToScreenReader = useCallback((message: string) => {
    setAnnouncement(message);
    // Clear announcement after screen reader has time to read it
    setTimeout(() => setAnnouncement(""), 1000);
  }, []);

  // Keyboard navigation handlers
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          if (focusedNodeIndex < filteredNodes.length - 1) {
            setFocusedNodeIndex(focusedNodeIndex + 1);
            announceToScreenReader(
              `Focused on ${filteredNodes[focusedNodeIndex + 1]?.label}`
            );
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          if (focusedNodeIndex > 0) {
            setFocusedNodeIndex(focusedNodeIndex - 1);
            announceToScreenReader(
              `Focused on ${filteredNodes[focusedNodeIndex - 1]?.label}`
            );
          }
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          if (
            focusedNodeIndex >= 0 &&
            focusedNodeIndex < filteredNodes.length
          ) {
            const nodeType = filteredNodes[focusedNodeIndex];
            // Simulate drag and drop for keyboard users
            announceToScreenReader(
              `Adding ${nodeType.label} to canvas. Use mouse to position the node.`
            );
            // In a real implementation, you would trigger the node creation here
          }
          break;
        case "Escape":
          setFocusedNodeIndex(-1);
          searchInputRef.current?.focus();
          break;
        case "Tab":
          // Let default tab behavior handle focus
          break;
      }
    },
    [focusedNodeIndex, filteredNodes, announceToScreenReader]
  );

  const handleCategoryKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          if (focusedCategoryIndex > 0) {
            setFocusedCategoryIndex(focusedCategoryIndex - 1);
            const category = categories[focusedCategoryIndex - 1];
            setSelectedCategory(category.name);
            announceToScreenReader(
              `Selected category ${category.name} with ${category.count} nodes`
            );
          }
          break;
        case "ArrowRight":
          event.preventDefault();
          if (focusedCategoryIndex < categories.length - 1) {
            setFocusedCategoryIndex(focusedCategoryIndex + 1);
            const category = categories[focusedCategoryIndex + 1];
            setSelectedCategory(category.name);
            announceToScreenReader(
              `Selected category ${category.name} with ${category.count} nodes`
            );
          }
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          const category = categories[focusedCategoryIndex];
          setSelectedCategory(category.name);
          announceToScreenReader(
            `Selected category ${category.name} with ${category.count} nodes`
          );
          break;
      }
    },
    [focusedCategoryIndex, categories, announceToScreenReader]
  );

  // Focus management
  useEffect(() => {
    if (focusedNodeIndex >= 0 && nodeListRef.current) {
      const nodeElements =
        nodeListRef.current.querySelectorAll("[data-node-index]");
      const focusedElement = nodeElements[focusedNodeIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.focus();
      }
    }
  }, [focusedNodeIndex]);

  // Reset focus when search or category changes
  useEffect(() => {
    setFocusedNodeIndex(-1);
  }, [searchQuery, selectedCategory]);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
    announceToScreenReader(`Dragging ${nodeType} node`);
  };

  const handleNodeClick = (nodeType: any) => {
    announceToScreenReader(
      `Selected ${nodeType.label}. Use mouse to drag to canvas or press Enter to add.`
    );
  };

  return (
    <>
      {/* Screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcement}
      </div>

      <aside
        className={`bg-white border-r border-gray-200 flex flex-col shadow-lg transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64 lg:w-72"
        }`}
        role="complementary"
        aria-label="Node Library"
      >
        {/* Header */}
        <header
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
                ref={toggleButtonRef}
                onClick={() => togglePanel("nodeLibrary")}
                className="w-10 h-10 bg-gradient-to-r from-gray-500 to-blue-500 rounded-xl flex items-center justify-center hover:from-gray-600 hover:to-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Expand Node Library"
                title="Expand Node Library"
              >
                <Grid className="w-5 h-5 text-white" aria-hidden="true" />
              </button>
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 bg-gradient-to-r from-gray-500 to-blue-500 rounded-xl flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <Grid className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Node Library
                    </h2>
                    <p className="text-sm text-gray-600">
                      Drag nodes to canvas or use keyboard navigation
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => togglePanel("nodeLibrary")}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Collapse Node Library panel"
                  title="Collapse panel"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </header>

        {!isCollapsed && (
          <>
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <label htmlFor="node-search" className="sr-only">
                Search nodes
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  ref={searchInputRef}
                  id="node-search"
                  type="text"
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    announceToScreenReader(
                      `Searching for ${e.target.value}. Found ${filteredNodes.length} results.`
                    );
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  aria-describedby="search-help"
                  aria-label="Search nodes by name or description"
                />
              </div>
              <div id="search-help" className="sr-only">
                Search nodes by name or description. Use arrow keys to navigate
                results.
              </div>
            </div>

            {/* Categories */}
            <div className="p-4 border-b border-gray-200">
              <fieldset>
                <legend className="sr-only">Filter nodes by category</legend>
                <div
                  ref={categoryButtonsRef}
                  className="flex flex-wrap gap-2"
                  role="tablist"
                  aria-label="Node categories"
                  onKeyDown={handleCategoryKeyDown}
                >
                  {categories.map((category, index) => (
                    <button
                      key={category.name}
                      onClick={() => {
                        setSelectedCategory(category.name);
                        setFocusedCategoryIndex(index);
                        announceToScreenReader(
                          `Selected category ${category.name} with ${category.count} nodes`
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        selectedCategory === category.name
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      role="tab"
                      aria-selected={selectedCategory === category.name}
                      aria-controls="node-list"
                      tabIndex={focusedCategoryIndex === index ? 0 : -1}
                      aria-label={`${category.name} category with ${category.count} nodes`}
                    >
                      {category.name} ({category.count})
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* View Mode Toggle */}
            <div className="p-4 border-b border-gray-200">
              <fieldset>
                <legend className="sr-only">View mode</legend>
                <div
                  className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1"
                  role="radiogroup"
                  aria-label="View mode"
                >
                  <button
                    onClick={() => {
                      setViewMode("grid");
                      announceToScreenReader("Switched to grid view");
                    }}
                    className={`p-1.5 rounded-md transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      viewMode === "grid"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500"
                    }`}
                    role="radio"
                    aria-checked={viewMode === "grid"}
                    aria-label="Grid view"
                  >
                    <Grid className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => {
                      setViewMode("list");
                      announceToScreenReader("Switched to list view");
                    }}
                    className={`p-1.5 rounded-md transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      viewMode === "list"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500"
                    }`}
                    role="radio"
                    aria-checked={viewMode === "list"}
                    aria-label="List view"
                  >
                    <List className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </fieldset>
            </div>

            {/* Node List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div
                ref={nodeListRef}
                id="node-list"
                className={`space-y-2 ${
                  viewMode === "grid" ? "grid grid-cols-1 gap-3" : ""
                }`}
                role="listbox"
                aria-label={`${filteredNodes.length} available nodes in ${selectedCategory} category`}
                onKeyDown={handleKeyDown}
                tabIndex={0}
              >
                {filteredNodes.length === 0 ? (
                  <div
                    className="text-center py-8 text-gray-500"
                    role="status"
                    aria-live="polite"
                  >
                    <p>No nodes found matching your search criteria.</p>
                  </div>
                ) : (
                  filteredNodes.map((nodeType, index) => {
                    const IconComponent = nodeType.icon;
                    const isFocused = focusedNodeIndex === index;
                    return (
                      <div
                        key={nodeType.type}
                        data-node-index={index}
                        className={`group flex items-center space-x-3 p-3 rounded-xl border cursor-move transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
                          isFocused ? "ring-2 ring-blue-500 ring-offset-2" : ""
                        } ${getColorClasses(nodeType.color)}`}
                        draggable
                        onDragStart={(event) =>
                          onDragStart(event, nodeType.type)
                        }
                        onClick={() => handleNodeClick(nodeType)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleNodeClick(nodeType);
                          }
                        }}
                        role="option"
                        aria-selected={isFocused}
                        tabIndex={isFocused ? 0 : -1}
                        aria-label={`${nodeType.label} node, ${nodeType.category} category. ${nodeType.description}. Drag to canvas or press Enter to add.`}
                        aria-describedby={`node-${nodeType.type}-description`}
                      >
                        <div className="flex-shrink-0">
                          <div
                            className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center"
                            aria-hidden="true"
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium truncate">
                              {nodeType.label}
                            </span>
                            <span
                              className="text-xs px-1.5 py-0.5 bg-white/60 rounded-full"
                              aria-label={`Category: ${nodeType.category}`}
                            >
                              {nodeType.category}
                            </span>
                          </div>
                          <p
                            id={`node-${nodeType.type}-description`}
                            className="text-xs text-gray-500 truncate"
                          >
                            {nodeType.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Keyboard shortcuts help */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                <h4 className="font-medium mb-2">Keyboard shortcuts:</h4>
                <ul className="space-y-1">
                  <li>
                    • Use{" "}
                    <kbd className="px-1 py-0.5 bg-gray-200 rounded">↑↓</kbd>{" "}
                    arrows to navigate nodes
                  </li>
                  <li>
                    • Press{" "}
                    <kbd className="px-1 py-0.5 bg-gray-200 rounded">Enter</kbd>{" "}
                    or{" "}
                    <kbd className="px-1 py-0.5 bg-gray-200 rounded">Space</kbd>{" "}
                    to add node
                  </li>
                  <li>
                    • Press{" "}
                    <kbd className="px-1 py-0.5 bg-gray-200 rounded">Esc</kbd>{" "}
                    to return to search
                  </li>
                  <li>
                    • Use{" "}
                    <kbd className="px-1 py-0.5 bg-gray-200 rounded">←→</kbd>{" "}
                    arrows to navigate categories
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
};
