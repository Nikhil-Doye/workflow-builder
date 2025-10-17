# Variable Substitution Example

This document demonstrates how the `{{input-1.output}}` variable substitution works in the workflow system.

## How It Works

### 1. **Data Flow Process**

```
Testing Panel Input → Data Input Node → Web Scraping Node → LLM Node → Data Output Node
```

### 2. **Variable Substitution Examples**

#### Example 1: Web Scraping Node

```json
{
  "config": {
    "url": "{{input-1.output}}",
    "formats": ["markdown", "html"]
  }
}
```

**What happens:**

1. User enters `"https://github.com"` in testing panel
2. Data Input Node stores: `{ output: "https://github.com" }`
3. Web Scraping Node processes: `"{{input-1.output}}"` → `"https://github.com"`
4. Firecrawl scrapes the actual GitHub URL

#### Example 2: LLM Task Node

```json
{
  "config": {
    "prompt": "Analyze this content: {{scraper-1.output}}",
    "model": "deepseek-chat"
  }
}
```

**What happens:**

1. Web Scraping Node outputs: `{ output: "[scraped content]" }`
2. LLM Node processes: `"{{scraper-1.output}}"` → `"[scraped content]"`
3. AI analyzes the actual scraped content

### 3. **Supported Variable Patterns**

| Pattern             | Description               | Example               |
| ------------------- | ------------------------- | --------------------- |
| `{{nodeId}}`        | Entire output of the node | `{{input-1}}`         |
| `{{nodeId.output}}` | Output property           | `{{input-1.output}}`  |
| `{{nodeId.data}}`   | Data property             | `{{scraper-1.data}}`  |
| `{{nodeId.status}}` | Status property           | `{{llm-1.status}}`    |
| `{{nodeId.error}}`  | Error property            | `{{scraper-1.error}}` |

### 4. **Complete Workflow Example**

```json
{
  "nodes": [
    {
      "id": "input-1",
      "type": "dataInput",
      "config": {
        "dataType": "url",
        "defaultValue": "https://example.com"
      }
    },
    {
      "id": "scraper-1",
      "type": "webScraping",
      "config": {
        "url": "{{input-1.output}}",
        "formats": ["markdown", "html"]
      }
    },
    {
      "id": "llm-1",
      "type": "llmTask",
      "config": {
        "prompt": "Summarize: {{scraper-1.output}}",
        "model": "deepseek-chat"
      }
    },
    {
      "id": "output-1",
      "type": "dataOutput",
      "config": {
        "format": "json",
        "filename": "analysis.json"
      }
    }
  ]
}
```

### 5. **Execution Flow**

1. **Testing Panel**: User enters `"https://github.com"`
2. **Data Input Node** (`input-1`):

   - Receives: `"https://github.com"`
   - Stores: `{ output: "https://github.com" }`
   - Status: `"success"`

3. **Web Scraping Node** (`scraper-1`):

   - Config URL: `"{{input-1.output}}"`
   - Variable substitution: `"{{input-1.output}}"` → `"https://github.com"`
   - Calls Firecrawl with: `"https://github.com"`
   - Returns: `{ output: "[GitHub page content]", markdown: "...", html: "..." }`

4. **LLM Task Node** (`llm-1`):

   - Config prompt: `"Summarize: {{scraper-1.output}}"`
   - Variable substitution: `"{{scraper-1.output}}"` → `"[GitHub page content]"`
   - Calls AI with: `"Summarize: [GitHub page content]"`
   - Returns: `{ output: "[AI summary of GitHub page]" }`

5. **Data Output Node** (`output-1`):
   - Receives: `"[AI summary of GitHub page]"`
   - Formats as JSON and saves to `analysis.json`

### 6. **Error Handling**

If a variable reference doesn't exist:

- `{{nonexistent-node.output}}` → `{{nonexistent-node.output}}` (unchanged)
- Warning logged to console
- Node continues with original string

### 7. **Testing the Feature**

1. Create a new workflow
2. Add a Data Input node with URL as default value
3. Add a Web Scraping node with URL set to `{{input-1.output}}`
4. Add an LLM Task node with prompt containing `{{scraper-1.output}}`
5. Run the workflow with a test URL
6. Observe how variables are substituted with actual data

This variable substitution system enables powerful data flow between nodes, making workflows dynamic and flexible!
