#!/bin/bash

# Vercel build script for CUUB Dashboard
echo "🚀 Starting Vercel build for CUUB Dashboard..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create necessary directories if they don't exist
echo "📁 Setting up directory structure..."
mkdir -p public/css public/js public/html

# Copy static files
echo "📋 Copying static files..."
cp -r public/* public/

# Set environment variables
echo "🔧 Setting environment variables..."
export NODE_ENV=production

# Build completed
echo "✅ Build completed successfully!"
echo "🎯 Ready for Vercel deployment"
