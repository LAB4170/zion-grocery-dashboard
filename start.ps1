#!/usr/bin/env pwsh
# Zion Grocery Dashboard - PowerShell Startup Script
# Works perfectly in VS Code terminal

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Zion Grocery Dashboard - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set working directory to script location
Set-Location $PSScriptRoot

# Set environment to development
$env:NODE_ENV = "development"

Write-Host "[1/3] Checking system requirements..." -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[2/3] Installing dependencies..." -ForegroundColor Yellow

# Change to backend directory
Set-Location "backend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Blue
    try {
        npm install
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Write-Host "Please run: npm install" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host "[3/3] Starting integrated server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Zion Grocery Dashboard - Running" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Environment: Local Development" -ForegroundColor White
Write-Host "Server: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Login: http://localhost:5000/login" -ForegroundColor Cyan
Write-Host "API: http://localhost:5000/api" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Starting server... (Press Ctrl+C to stop)" -ForegroundColor Yellow
Write-Host ""

# Start the integrated server
try {
    node server.js
} catch {
    Write-Host ""
    Write-Host "❌ Server failed to start" -ForegroundColor Red
    Write-Host "Check the error messages above for details" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
