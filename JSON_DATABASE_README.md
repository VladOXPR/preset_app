# JSON Database for Local Development

This project uses a JSON-based database for local development instead of SQLite or Neon PostgreSQL. This makes it much easier to develop and test locally without needing external database services.

## How it Works

The JSON database stores data in two files:
- `data/users.json` - Stores user information
- `data/messages.json` - Stores chat messages

## Demo Data

The database comes pre-populated with demo users and messages:

### Demo Users
- **admin** (password: "password")
- **john_doe** (password: "password")
- **jane_smith** (password: "password")
- **bob_wilson** (password: "password")
- **alice_brown** (password: "password")

### Demo Messages
The database includes sample conversations between the demo users to test the chat functionality.

## Database Management

Use the database manager script to manage your JSON database:

```bash
# Show database statistics
node data/db-manager.js stats

# Reset database with fresh demo data
node data/db-manager.js reset

# Add a new user
node data/db-manager.js add-user username phone password

# Clear all messages
node data/db-manager.js clear-messages
```

## File Structure

```
data/
├── users.json          # User data
├── messages.json       # Chat messages
└── db-manager.js      # Database management script
```

## Database Schema

### Users (`users.json`)
```json
{
  "id": 1,
  "username": "john_doe",
  "phone": "+1987654321",
  "password": "hashed_password",
  "created_at": "2024-01-02T10:30:00.000Z"
}
```

### Messages (`messages.json`)
```json
{
  "id": 1,
  "from_user": "john_doe",
  "to_user": "jane_smith",
  "text": "Hey Jane! How's it going?",
  "timestamp": "2024-01-06T10:00:00.000Z"
}
```

## Benefits

1. **No external dependencies** - No need for SQLite or PostgreSQL
2. **Easy to understand** - Data is stored in human-readable JSON format
3. **Simple to manage** - Easy to add, modify, or reset data
4. **Version control friendly** - JSON files can be tracked in git
5. **Fast development** - No database setup required

## Getting Started

1. Start the server:
   ```bash
   npm start
   ```

2. Visit `http://localhost:3000`

3. Login with any demo user (password: "password")

4. Test the chat functionality between different users

## Production Deployment

For production deployment with Vercel, the application will automatically use Neon PostgreSQL when the `DATABASE_URL` environment variable is set. The JSON database is only used for local development.

## Troubleshooting

### Reset Database
If you need to start fresh:
```bash
node data/db-manager.js reset
```

### View Database Stats
To see current data:
```bash
node data/db-manager.js stats
```

### Add New Users
```bash
node data/db-manager.js add-user newuser +1234567890 mypassword
```

## Notes

- All passwords in the demo data are hashed using bcrypt
- The database automatically creates the necessary files on first run
- Data is persisted between server restarts
- The JSON format makes it easy to manually edit data if needed 