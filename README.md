# Agent Workflow Builder

An open-source, visual workflow builder for creating AI-powered agent workflows, similar to N8N or sim.ai, built with React Flow and modern web technologies.

## 🚀 Features

### Visual Workflow Editor

- **Drag & Drop Interface**: Intuitive node-based workflow creation
- **Real-time Connection**: Connect nodes with visual edges
- **Node Palette**: Easy access to all available node types
- **Responsive Design**: Works on desktop and tablet devices

### AI-Powered Node Types

- **🌐 Web Scraping**: Extract data from websites
- **🤖 LLM Task**: General language model operations
- **🧠 Embedding Generator**: Create vector embeddings
- **🔍 Similarity Search**: Find similar content in vector stores
- **📋 Structured Output**: Parse and structure data with schemas
- **📥 Data Input**: Workflow entry points
- **📤 Data Output**: Workflow exit points

### Workflow Management

- **Save & Load**: Persistent workflow storage
- **Import/Export**: Share workflows as JSON files
- **Version Control**: Track workflow changes
- **Workflow Library**: Manage multiple workflows

### Execution & Testing

- **Real-time Execution**: Step-by-step workflow processing
- **Visual Feedback**: Live status indicators for each node
- **Test Interface**: Run workflows with sample data
- **Execution Logs**: Detailed execution history and debugging
- **Error Handling**: Clear error messages and recovery

### Advanced Features

- **Configurable Parameters**: Customize each node's behavior
- **Data Flow Visualization**: See data passing between nodes
- **Execution Results**: View and export workflow outputs
- **Modular Architecture**: Easy to extend with new node types

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Visual Editor**: React Flow
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/agent-workflow-builder.git
   cd agent-workflow-builder
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 Quick Start

### Creating Your First Workflow

1. **Start the Application**

   - Open the app in your browser
   - Click "New Workflow" to create your first workflow

2. **Add Nodes**

   - Click "Show Node Palette" to reveal available node types
   - Drag nodes from the palette onto the canvas
   - Connect nodes by dragging from output handles to input handles

3. **Configure Nodes**

   - Click on any node to open its configuration panel
   - Set parameters like URLs, prompts, model settings, etc.
   - Customize node labels for better organization

4. **Test Your Workflow**

   - Use the Testing Panel to provide sample input data
   - Click "Run Test" to execute the workflow
   - View results in real-time as each node processes

5. **Save and Export**
   - Click "Save" to persist your workflow
   - Use "Export" to download your workflow as a JSON file
   - Share workflows by importing JSON files

### Example Workflow: Web Scraping + AI Analysis

1. **Add a Data Input node** - Set it to provide a URL
2. **Add a Web Scraping node** - Configure it to scrape the URL
3. **Add an LLM Task node** - Set up a prompt to analyze the scraped content
4. **Add a Data Output node** - To capture the final result
5. **Connect the nodes** in sequence
6. **Test with a sample URL** and see the results

## 🏗️ Architecture

### Project Structure

```
src/
├── components/           # React components
│   ├── nodes/           # Node type components
│   ├── WorkflowEditor.tsx
│   ├── WorkflowList.tsx
│   ├── NodeConfiguration.tsx
│   ├── ExecutionPanel.tsx
│   └── TestingPanel.tsx
├── store/               # State management
│   └── workflowStore.ts
├── types/               # TypeScript definitions
│   └── index.ts
├── utils/               # Utility functions
│   └── workflowSerialization.ts
└── App.tsx             # Main application
```

### Key Components

- **WorkflowEditor**: Main visual editor using React Flow
- **NodeConfiguration**: Modal for configuring node parameters
- **ExecutionPanel**: Real-time execution monitoring
- **TestingPanel**: Test interface with sample data
- **workflowStore**: Centralized state management with Zustand

## 🔧 Configuration

### Node Types and Parameters

Each node type supports specific configuration options:

#### Web Scraping Node

- `url`: Target website URL
- `selector`: CSS selector for content extraction
- `maxLength`: Maximum content length to extract

#### LLM Task Node

- `prompt`: The prompt to send to the language model
- `model`: AI model selection (GPT-3.5, GPT-4, Claude, etc.)
- `temperature`: Response creativity (0-2)
- `maxTokens`: Maximum response length

#### Embedding Generator

- `model`: Embedding model selection
- `dimensions`: Vector dimensions

#### Similarity Search

- `vectorStore`: Target vector database
- `topK`: Number of similar results to return
- `threshold`: Similarity threshold (0-1)

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

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

**Nodes not connecting?**

- Ensure you're dragging from output handles to input handles
- Check that nodes are properly positioned

**Workflow not executing?**

- Verify all required node parameters are configured
- Check the execution panel for error messages

**Import/Export not working?**

- Ensure you're using valid JSON format
- Check browser console for error messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React Flow](https://reactflow.dev/) for the visual editor
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide React](https://lucide.dev/) for icons
- [Zustand](https://github.com/pmndrs/zustand) for state management

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/agent-workflow-builder/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/agent-workflow-builder/discussions)
- **Email**: support@agentworkflowbuilder.com

---

**Built with ❤️ for the AI community**
