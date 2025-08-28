# Station-Based User Permission System

## Overview

This system has been updated to replace the bio field with station-based permissions. Each user is now assigned specific station IDs, and they can only see and interact with stations they have access to.

## Key Changes

### 1. User Data Structure
- **Before**: Users had a `bio` field with personal descriptions
- **After**: Users now have a `station_ids` field containing an array of station IDs they can access

### 2. Station Access Control
- Users can only see stations assigned to their account
- Station filtering happens on the server side for security
- Users without station assignments see a message to contact administrators

### 3. Admin Management
- Administrators can assign/update station permissions for any user
- Station assignments are managed through the admin panel
- Real-time updates to user permissions

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  station_ids TEXT DEFAULT '[]',  -- JSON array of station IDs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Station IDs Format
Station IDs are stored as a JSON array of strings:
```json
["ST001", "ST002", "ST003"]
```

## API Endpoints

### Get User's Stations (Filtered)
```
GET /api/stations
```
- Requires authentication
- Returns only stations the user has access to
- Includes user permissions and total station count

### Update User Station Assignments
```
POST /admin/update-user-stations
Body: { userId: number, stationIds: string }
```
- Admin only
- Updates user's station permissions
- Station IDs should be comma-separated

## Frontend Changes

### Signup Form
- Replaced bio textarea with station IDs input
- Users enter comma-separated station IDs during registration

### Admin Panel
- Shows current station assignments for each user
- Input field to update station permissions
- Real-time updates

### Home Page
- Displays only user's assigned stations
- Shows helpful message if no stations are assigned

## Migration

### For Existing Users
Run the migration script to convert existing users:
```bash
node migrate-bio-to-stations.js
```

This script will:
- Convert bio content to appropriate station assignments
- Remove the bio field
- Add station_ids field with default assignments

### Manual Migration
If you prefer manual migration, update your users.json file:
```json
{
  "id": 1,
  "username": "user",
  "phone": "+1234567890",
  "password": "hashed_password",
  "station_ids": ["ST001", "ST002"],
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

## Usage Examples

### Creating a New User with Stations
```bash
# Via command line
node data/db-manager.js add-user john +1234567890 password ST001,ST002

# Via admin panel
# Enter: ST001,ST002 in the station IDs field
```

### Updating User Stations
```bash
# Via admin panel
# Change station IDs to: ST003,ST004,ST005
# Click "Update Stations"
```

### Station ID Examples
- `ST001` - Station 1
- `ST002` - Station 2
- `ST003` - Station 3
- `ST004` - Station 4
- `ST005` - Station 5

## Security Features

1. **Server-side filtering**: Station access is enforced on the server
2. **JWT authentication**: All station requests require valid authentication
3. **Permission validation**: Users cannot access stations not assigned to them
4. **Admin-only updates**: Only administrators can modify station assignments

## Troubleshooting

### User sees no stations
- Check if user has station_ids assigned
- Verify station IDs match actual station data
- Check admin panel for current assignments

### Station updates not working
- Ensure user ID is correct
- Check station ID format (comma-separated)
- Verify admin permissions

### Migration issues
- Backup users.json before running migration
- Check console output for errors
- Verify file permissions

## Future Enhancements

1. **Station Groups**: Group stations for easier management
2. **Role-based Access**: Different permission levels for different user types
3. **Audit Logging**: Track station access and changes
4. **Bulk Operations**: Update multiple users' stations at once
5. **Station Templates**: Predefined station permission sets 