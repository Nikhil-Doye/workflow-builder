# Agent Workflow Builder Setup Script for Windows

Write-Host "🚀 Setting up Agent Workflow Builder..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 16+ and try again." -ForegroundColor Red
    exit 1
}

# Check Node.js version
$versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($versionNumber -lt 16) {
    Write-Host "❌ Node.js version 16+ is required. Current version: $nodeVersion" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
if (!(Test-Path .env)) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    @"
# Agent Workflow Builder Environment Variables
REACT_APP_VERSION=1.0.0
REACT_APP_NAME=Agent Workflow Builder
"@ | Out-File -FilePath .env -Encoding UTF8
    Write-Host "✅ .env file created" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup complete! You can now run:" -ForegroundColor Green
Write-Host "   npm start    - Start the development server" -ForegroundColor Cyan
Write-Host "   npm run build - Build for production" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 The application will be available at http://localhost:3000" -ForegroundColor Cyan
