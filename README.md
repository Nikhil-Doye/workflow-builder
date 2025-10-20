# Agent Workflow Builder

An open-source, visual workflow builder for creating AI-powered agent workflows, similar to N8N or Zapier, built with React Flow and modern web technologies. Create sophisticated automation workflows with AI models, web scraping, and data processing capabilities.

## 🚀 Features

### Visual Workflow Editor

- **Drag & Drop Interface**: Intuitive node-based workflow creation
- **Real-time Connection**: Connect nodes with visual edges
- **Node Palette**: Easy access to all available node types
- **Responsive Design**: Works on desktop and tablet devices
- **Variable Substitution**: Use `{{nodeId.output}}` or `{{nodelabel.output}}` to pass data between nodes

### AI-Powered Node Types

- **🌐 Web Scraping**: Extract data from websites using Firecrawl AI
- **🤖 LLM Task**: General language model operations (DeepSeek, OpenAI)
- **🧠 Embedding Generator**: Create vector embeddings for semantic search
- **🔍 Similarity Search**: Find similar content in vector stores
- **📋 Structured Output**: Parse and structure data with JSON schemas
- **📥 Data Input**: Workflow entry points (text, JSON, CSV, URL, PDF)
- **📤 Data Output**: Workflow exit points with multiple formats

### AI Copilot Assistant

- **Natural Language Processing**: Describe workflows in plain English
- **Intelligent Workflow Generation**: AI creates workflows from descriptions
- **Contextual Suggestions**: Get smart recommendations based on your workflow
- **Validation & Optimization**: Automatic workflow validation and improvement tips
- **Mixed Intent Analysis**: Handle complex, multi-step workflow requirements

### Workflow Management

- **Save & Load**: Persistent workflow storage in browser
- **Import/Export**: Share workflows as JSON files
- **Version Control**: Track workflow changes with timestamps
- **Workflow Library**: Manage multiple workflows with search and filtering
- **Demo Workflows**: Pre-built example workflows to get started

### Execution & Testing

- **Real-time Execution**: Step-by-step workflow processing with live updates
- **Visual Feedback**: Live status indicators for each node (idle, running, success, error)
- **Test Interface**: Run workflows with sample data and custom inputs
- **Execution Logs**: Detailed execution history and debugging information
- **Error Handling**: Clear error messages and recovery suggestions
- **Performance Monitoring**: Track execution times and resource usage

### Advanced Features

- **Configurable Parameters**: Customize each node's behavior and settings
- **Data Flow Visualization**: See data passing between nodes in real-time
- **Execution Results**: View and export workflow outputs in multiple formats
- **Modular Architecture**: Easy to extend with new node types
- **PDF Processing**: Upload and process PDF documents with text extraction
- **API Integration**: Seamless integration with DeepSeek, OpenAI, and Firecrawl APIs

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Visual Editor**: React Flow v11
- **Styling**: Tailwind CSS with custom animations
- **State Management**: Zustand
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **AI Integration**:
  - DeepSeek API (primary LLM)
  - OpenAI API (alternative LLM)
  - Firecrawl AI (web scraping)
- **PDF Processing**: Browser-based PDF.js
- **Build Tool**: Create React App

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Nikhil-Doye/workflow-builder.git
   cd workflow-builder
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure API Keys** (Optional but recommended)

   - The app will prompt you to configure API keys on first launch
   - You can also configure them later through the settings menu
   - Required APIs:
     - **DeepSeek API**: For LLM tasks and AI processing
     - **Firecrawl API**: For web scraping functionality
     - **OpenAI API**: Alternative LLM provider

4. **Start the development server**

   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 Quick Start

### Method 1: AI Copilot (Recommended)

1. **Start the Application**

   - Open the app in your browser
   - Click "New Workflow" to create your first workflow

2. **Use AI Copilot**

   - Click the "AI Copilot" button in the toolbar
   - Describe your workflow in natural language (e.g., "scrape a website and analyze the content")
   - Let the AI generate the workflow structure for you
   - Review and modify the generated workflow as needed

3. **Test and Execute**
   - Use the Testing Panel to provide sample input data
   - Click "Run Test" to execute the workflow
   - View results in real-time as each node processes

### Method 2: Manual Workflow Creation

1. **Add Nodes**

   - Click "Show Node Palette" to reveal available node types
   - Drag nodes from the palette onto the canvas
   - Connect nodes by dragging from output handles to input handles

2. **Configure Nodes**

   - Click on any node to open its configuration panel
   - Set parameters like URLs, prompts, model settings, etc.
   - Use variable substitution: `{{nodeId.output}}` or `{{nodelabel.output}}` to pass data between nodes

3. **Test Your Workflow**

   - Use the Testing Panel to provide sample input data
   - Click "Run Test" to execute the workflow
   - View results in real-time as each node processes

4. **Save and Export**
   - Click "Save" to persist your workflow
   - Use "Export" to download your workflow as a JSON file
   - Share workflows by importing JSON files

### Example Workflows

#### Web Scraping + AI Analysis

1. **Data Input** → **Web Scraping** → **LLM Task** → **Data Output**
2. Configure the Web Scraping node with a URL
3. Set up the LLM Task with a prompt like "Analyze this content: {{scraper.output}}"
4. Test with a sample URL

#### Document Processing Pipeline

1. **Data Input (PDF)** → **LLM Task** → **Structured Output** → **Data Output**
2. Upload a PDF document
3. Extract and process the text with AI
4. Structure the output according to a JSON schema

#### Embedding & Search Workflow

1. **Data Input** → **Embedding Generator** → **Similarity Search** → **Data Output**
2. Create embeddings from input text
3. Search for similar content in a vector store
4. Return the most relevant results

## 🏗️ Architecture

### Project Structure

```
src/
├── components/           # React components
│   ├── nodes/           # Node type components
│   │   ├── BaseNode.tsx
│   │   ├── DataInputNode.tsx
│   │   ├── DataOutputNode.tsx
│   │   ├── WebScrapingNode.tsx
│   │   ├── LLMNode.tsx
│   │   ├── EmbeddingNode.tsx
│   │   ├── SimilaritySearchNode.tsx
│   │   └── StructuredOutputNode.tsx
│   ├── WorkflowEditor.tsx
│   ├── WorkflowList.tsx
│   ├── WorkflowToolbar.tsx
│   ├── NodeConfiguration.tsx
│   ├── ExecutionPanel.tsx
│   ├── TestingPanel.tsx
│   ├── CopilotPanel.tsx
│   ├── OnboardingModal.tsx
│   └── OpenAIConfig.tsx
├── services/            # External service integrations
│   ├── openaiService.ts
│   ├── firecrawlService.ts
│   ├── copilotService.ts
│   └── pdfService.ts
├── store/               # State management
│   └── workflowStore.ts
├── types/               # TypeScript definitions
│   └── index.ts
├── utils/               # Utility functions
│   ├── workflowSerialization.ts
│   ├── workflowValidator.ts
│   ├── workflowGenerator.ts
│   ├── variableSubstitution.ts
│   └── patternMatchers.ts
├── examples/            # Example workflows and documentation
└── App.tsx             # Main application
```

### Key Components

- **WorkflowEditor**: Main visual editor using React Flow with drag-and-drop functionality
- **CopilotPanel**: AI-powered workflow generation and assistance
- **NodeConfiguration**: Modal for configuring node parameters and settings
- **ExecutionPanel**: Real-time execution monitoring with live status updates
- **TestingPanel**: Test interface with sample data and custom inputs
- **WorkflowList**: Workflow management with search, filtering, and CRUD operations
- **workflowStore**: Centralized state management with Zustand for workflow data
- **Services**: Modular service layer for AI APIs, web scraping, and PDF processing

## 🔧 Configuration

### API Keys Setup

The application requires API keys for full functionality:

1. **DeepSeek API Key** (Primary LLM)

   - Get your key from [DeepSeek Platform](https://platform.deepseek.com/api_keys)
   - Used for LLM tasks and AI processing
   - Format: `sk-...`

2. **Firecrawl API Key** (Web Scraping)

   - Get your key from [Firecrawl](https://firecrawl.dev)
   - Used for web scraping functionality
   - Format: `fc-...`

3. **OpenAI API Key** (Alternative LLM)
   - Get your key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Used as fallback for LLM tasks
   - Format: `sk-...`

### Node Types and Parameters

Each node type supports specific configuration options:

#### Variable Substitution with Node Labels

The workflow builder now supports intuitive variable substitution using node labels:

**Traditional Method (Node IDs):**

```
{{node-1234567890.output}}
```

**New Method (Node Labels):**

```
{{Website URL.output}}
{{Web Scraper.output}}
{{Content Analyzer.output}}
```

**Benefits:**

- **More Intuitive**: Use descriptive names instead of cryptic IDs
- **Easier to Read**: Workflow configurations are self-documenting
- **Better UX**: No need to remember or look up node IDs
- **Backward Compatible**: Both methods work together

**Requirements:**

- Each node must have a unique label within the workflow
- Labels are case-sensitive
- Empty labels are not allowed
- The system validates label uniqueness automatically

#### Web Scraping Node (Firecrawl AI)

- `url`: Target website URL (supports variable substitution)
- `formats`: Output formats (markdown, html, text, summary, links, images)
- `onlyMainContent`: Extract only main content (boolean)
- `includeTags`: CSS selectors to include (comma-separated)
- `excludeTags`: CSS selectors to exclude (comma-separated)
- `maxLength`: Maximum content length to extract
- `waitFor`: Wait time for dynamic content (milliseconds)
- `timeout`: Request timeout (milliseconds)

#### LLM Task Node

- `prompt`: The prompt to send to the language model (supports variables)
- `model`: AI model selection (deepseek-chat, deepseek-reasoner)
- `temperature`: Response creativity (0-2, default: 0.7)
- `maxTokens`: Maximum response length (default: 1000)

#### Data Input Node

- `dataType`: Input data type (text, json, csv, url, pdf)
- `defaultValue`: Default input value or sample data

#### Data Output Node

- `format`: Output format (json, text, csv)
- `filename`: Output filename for exports

#### Embedding Generator

- `model`: Embedding model selection (text-embedding-ada-002, text-embedding-3-small)
- `dimensions`: Vector dimensions (default: 1536)

#### Similarity Search

- `vectorStore`: Target vector database (pinecone, weaviate, chroma)
- `topK`: Number of similar results to return (default: 5)
- `threshold`: Similarity threshold (0-1, default: 0.8)

#### Structured Output

- `schema`: JSON schema for structured output
- `model`: AI model for structured generation

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify

```bash
npm run build
# Upload the 'build' folder to Netlify
```

### Deploy to GitHub Pages

```bash
npm run build
# Push the build folder to a gh-pages branch
```

### Environment Variables

For production deployment, you may want to set up environment variables:

- `REACT_APP_DEEPSEEK_API_KEY`: DeepSeek API key
- `REACT_APP_FIRECRAWL_API_KEY`: Firecrawl API key
- `REACT_APP_OPENAI_API_KEY`: OpenAI API key

Note: API keys are currently stored in browser localStorage for security.

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 🐛 Troubleshooting

### Common Issues

**API Key Issues**

- Ensure API keys are properly configured in the settings
- Check that API keys have the correct format (sk-... for AI, fc-... for Firecrawl)
- Verify API keys have sufficient credits/permissions

**Nodes not connecting?**

- Ensure you're dragging from output handles (bottom) to input handles (top)
- Check that nodes are properly positioned and not overlapping
- Verify the workflow has a clear data flow path

**Workflow not executing?**

- Verify all required node parameters are configured
- Check the execution panel for detailed error messages
- Ensure all nodes are properly connected in sequence
- Check that variable substitutions are correct (e.g., `{{nodeId.output}}` or `{{nodelabel.output}}`)

**Web Scraping Issues**

- Verify the target URL is accessible and not blocked
- Check Firecrawl API key and credits
- Try different output formats or content selectors
- Ensure the website allows scraping (check robots.txt)

**LLM Task Issues**

- Verify AI API key is valid and has credits
- Check that prompts are properly formatted
- Ensure variable substitutions in prompts are correct
- Try different models or adjust temperature settings

**Import/Export not working?**

- Ensure you're using valid JSON format
- Check browser console for error messages
- Verify the workflow structure is complete

**PDF Processing Issues**

- Ensure the PDF file is not password-protected
- Check file size limits (large files may timeout)
- Verify the PDF contains extractable text (not just images)

### Getting Help

- Check the **Execution Panel** for detailed error messages and logs
- Use the **Testing Panel** to debug with sample data
- Review the **AI Copilot** suggestions for workflow improvements
- Check browser console for technical error details

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React Flow](https://reactflow.dev/) for the visual editor
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide React](https://lucide.dev/) for icons
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [DeepSeek](https://www.deepseek.com/) for AI language models
- [Firecrawl](https://firecrawl.dev/) for web scraping capabilities
- [OpenAI](https://openai.com/) for alternative AI models

## 📚 Additional Resources

- [Getting Started Guide](GETTING_STARTED.md) - Detailed setup and first workflow tutorial
- [Variable Substitution Examples](src/examples/variableSubstitutionExample.md) - Learn how to pass data between nodes
- [Demo Workflows](public/demo-workflows.json) - Pre-built example workflows

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/agent-workflow-builder/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/agent-workflow-builder/discussions)
- **Documentation**: Check the Getting Started guide and examples

## 🔮 Roadmap

- [ ] More AI model integrations (Claude, Gemini)
- [ ] Advanced workflow templates
- [ ] Team collaboration features
- [ ] Workflow scheduling and automation
- [ ] Custom node development SDK
- [ ] Workflow analytics and monitoring
- [ ] Database integrations
- [ ] API endpoint creation

---

**Built with ❤️ for the AI community**

_Empowering developers to create sophisticated AI workflows without the complexity._
