#!/bin/bash

# Agent Workflow Builder Setup Script

echo "🚀 Setting up Agent Workflow Builder..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Agent Workflow Builder Environment Variables
REACT_APP_VERSION=1.0.0
REACT_APP_NAME=Agent Workflow Builder
EOF
    echo "✅ .env file created"
fi

echo ""
echo "🎉 Setup complete! You can now run:"
echo "   npm start    - Start the development server"
echo "   npm run build - Build for production"
echo ""
echo "🌐 The application will be available at http://localhost:3000"
