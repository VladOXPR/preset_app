# Preset App

A station management application built with Express.js and SQLite, featuring user authentication and station data display.

## Features

- User registration and login
- Station data display and management
- Session management
- SQLite database storage

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

## Deployment on Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Follow the prompts to configure your deployment

## Project Structure

```
├── server.js          # Main Express server
├── database.js        # SQLite database operations
├── vercel.json        # Vercel configuration
├── package.json       # Dependencies and scripts
├── data/              # Data storage
│   └── app.db         # SQLite database file
└── public/            # Static files
    ├── login.html     # Login page
    ├── signup.html    # Signup page
    ├── home.html      # Home page
    
    ├── style.css      # Styles
    └── home.js        # Home page logic
```

## Database Schema

### Users Table
- `id` (INTEGER PRIMARY KEY)
- `username` (TEXT UNIQUE)
- `phone` (TEXT)
- `password` (TEXT - hashed)
- `created_at` (DATETIME)



## Important Notes

- This app uses SQLite for data storage which is more reliable than file-based storage
- Sessions are still stored in memory and may not work as expected on Vercel
- For production use, consider using Vercel Postgres for better scalability 