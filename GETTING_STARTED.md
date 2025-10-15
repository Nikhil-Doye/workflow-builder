# Getting Started with Agent Workflow Builder

Welcome to the Agent Workflow Builder! This guide will help you create your first AI-powered workflow in just a few minutes.

## 🚀 Quick Start

### 1. Installation

**Windows:**

```powershell
# Run the setup script
.\scripts\setup.ps1

# Or manually install dependencies
npm install
```

**macOS/Linux:**

```bash
# Run the setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# Or manually install dependencies
npm install
```

### 2. Start the Application

```bash
npm start
```

Open your browser and go to `http://localhost:3000`

## 🎯 Your First Workflow

Let's create a simple workflow that takes text input and processes it with AI.

### Step 1: Create a New Workflow

1. Click **"New Workflow"** on the home screen
2. Enter a name like "My First Workflow"
3. Click **"Create"**

### Step 2: Add Nodes

1. Click **"Show Node Palette"** to reveal the node types
2. Drag a **Data Input** node onto the canvas
3. Drag an **LLM Task** node onto the canvas
4. Drag a **Data Output** node onto the canvas

### Step 3: Connect the Nodes

1. Click and drag from the bottom of the Data Input node to the top of the LLM Task node
2. Click and drag from the bottom of the LLM Task node to the top of the Data Output node

### Step 4: Configure the Nodes

1. **Click on the Data Input node** to open its configuration:

   - Set Data Type to "text"
   - Enter default value: "Hello, world!"

2. **Click on the LLM Task node** to open its configuration:

   - Enter prompt: "Analyze the following text and provide insights: {{input}}"
   - Select model: "gpt-3.5-turbo"
   - Set temperature: 0.7

3. **Click on the Data Output node** to open its configuration:
   - Set format to "text"
   - Enter filename: "analysis.txt"

### Step 5: Test Your Workflow

1. Go to the **Testing Panel** on the right
2. Enter some test text in the input field
3. Click **"Run Test"**
4. Watch as each node processes the data
5. View the results in the execution panel

### Step 6: Save Your Workflow

1. Click **"Save"** in the toolbar
2. Your workflow is now saved and can be loaded later

## 🌟 Example Workflows

### Web Scraping + AI Analysis

Create a workflow that:

1. Takes a URL as input
2. Scrapes the website content
3. Analyzes the content with AI
4. Outputs the analysis

**Nodes needed:**

- Data Input (URL)
- Web Scraping
- LLM Task (Analysis)
- Data Output

### Document Processing Pipeline

Create a workflow that:

1. Takes document text
2. Generates embeddings
3. Performs similarity search
4. Returns similar documents

**Nodes needed:**

- Data Input (Text)
- Embedding Generator
- Similarity Search
- Data Output

## 🔧 Node Types Explained

### Data Input/Output

- **Purpose**: Entry and exit points for your workflow
- **Configuration**: Data type, default values, output format

### Web Scraping

- **Purpose**: Extract content from websites
- **Configuration**: URL, CSS selectors, content length limits

### LLM Task

- **Purpose**: Process text with AI language models
- **Configuration**: Prompts, model selection, temperature, token limits

### Embedding Generator

- **Purpose**: Create vector representations of text
- **Configuration**: Model selection, vector dimensions

### Similarity Search

- **Purpose**: Find similar content in vector databases
- **Configuration**: Vector store, result count, similarity threshold

### Structured Output

- **Purpose**: Parse and structure data according to schemas
- **Configuration**: JSON schema, model selection

## 💡 Tips & Best Practices

### Workflow Design

- **Start Simple**: Begin with basic workflows and add complexity gradually
- **Clear Naming**: Use descriptive names for nodes and workflows
- **Test Frequently**: Test your workflow at each step
- **Error Handling**: Consider what happens when nodes fail

### Node Configuration

- **Use Variables**: Reference other node outputs with `{{nodeId.output}}`
- **Set Reasonable Limits**: Configure appropriate token and length limits
- **Choose Right Models**: Select models based on your specific needs

### Performance

- **Parallel Processing**: Some nodes can run in parallel
- **Caching**: Consider caching results for expensive operations
- **Monitoring**: Use the execution panel to monitor performance

## 🐛 Troubleshooting

### Common Issues

**"Nodes not connecting"**

- Make sure you're dragging from output handles (bottom) to input handles (top)
- Check that nodes are properly positioned

**"Workflow not executing"**

- Verify all required parameters are configured
- Check the execution panel for error messages
- Ensure all nodes are properly connected

**"Import/Export not working"**

- Make sure you're using valid JSON format
- Check browser console for error messages

### Getting Help

- Check the **Execution Panel** for detailed error messages
- Use the **Testing Panel** to debug with sample data
- Review the **README.md** for detailed documentation

## 🎉 Next Steps

Now that you've created your first workflow:

1. **Explore More Node Types**: Try different AI operations
2. **Create Complex Workflows**: Combine multiple node types
3. **Share Your Workflows**: Export and share with others
4. **Customize the Interface**: Modify node configurations
5. **Integrate with APIs**: Connect to real AI services

## 📚 Additional Resources

- [Full Documentation](README.md)
- [API Reference](docs/API.md)
- [Node Type Guide](docs/NODE_TYPES.md)
- [Examples Gallery](docs/EXAMPLES.md)

Happy building! 🚀
