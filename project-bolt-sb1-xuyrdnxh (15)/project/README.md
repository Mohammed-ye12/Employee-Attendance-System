# Employee Attendance System

A secure, role-based attendance management system built with React, TypeScript, and Supabase.

## Features

- **Secure Authentication**
  - Email/password authentication through Supabase
  - Role-based access control
  - Department/section-based data isolation

- **User Management**
  - New user registration with admin approval
  - Department and section assignment
  - Role-based permissions

- **Attendance Tracking**
  - Multiple shift types
  - Leave management
  - Overtime tracking
  - Manager approval workflow

- **Reporting**
  - Comprehensive filtering
  - CSV export
  - Section-specific views

## Tech Stack

- Frontend: React 18 with TypeScript
- UI: TailwindCSS
- Backend: Supabase
  - PostgreSQL database
  - Row Level Security
  - Real-time subscriptions
- Build Tool: Vite

## Security Features

- Row Level Security (RLS) policies
- Secure password handling through Supabase Auth
- Role-based access control
- Data isolation by department/section

## Database Schema

### Profiles Table
- Links to Supabase auth.users
- Stores user profile information
- Includes department and section data

### Shift Entries Table
- Stores attendance records
- Links to profiles
- Includes approval workflow data

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Supabase:
   - Create a new Supabase project
   - Copy `.env.example` to `.env`
   - Update Supabase credentials in `.env`
   - Run migrations from `supabase/migrations`

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to your hosting platform of choice

## Development

### Database Migrations

All migrations are in `supabase/migrations`. Run them in order to set up the database schema.

### Type Safety

Database types are generated in `src/lib/database.types.ts`. Update them when the schema changes:

```bash
supabase gen types typescript --project-id your-project-id > src/lib/database.types.ts
```

## Security Considerations

- All database access is controlled through RLS policies
- Passwords are handled by Supabase Auth
- Data is isolated by department/section
- Audit logs for critical actions

## Future Enhancements

- Email notifications
- Mobile app
- Advanced reporting
- Biometric integration
- Unit tests
- API documentation