# Clerk + MongoDB Setup Guide

This document explains the Clerk authentication + MongoDB integration for your AlinHub project.

## Overview

Your project now has:
- ✅ Clerk authentication (email/password)
- ✅ MongoDB with Mongoose for data persistence
- ✅ Role-based access control (teacher/student)
- ✅ Webhook sync from Clerk to MongoDB
- ✅ Protected API routes and pages
- ✅ Role-specific dashboards

## Setup Instructions

### 1. Clerk Configuration

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy your keys and add them to `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
   CLERK_SECRET_KEY=your_secret_key
   CLERK_WEBHOOK_SECRET=your_webhook_secret
   ```

### 2. MongoDB Setup

1. Create a MongoDB cluster at [mongodb.com](https://mongodb.com)
2. Get your connection string
3. Add to `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
   ```

### 3. Clerk Webhook Setup

1. In Clerk Dashboard, go to Webhooks
2. Create a new endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Add the webhook secret to `.env.local` as `CLERK_WEBHOOK_SECRET`

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── webhooks/clerk/route.ts    # Syncs Clerk users to MongoDB
│   │   ├── user/
│   │   │   ├── profile/route.ts       # Get user profile
│   │   │   └── role/route.ts          # Update user role
│   ├── auth/
│   │   ├── sign-in/page.tsx           # Login page
│   │   └── sign-up/page.tsx           # Signup page
│   ├── dashboard/
│   │   ├── onboarding/page.tsx        # Role selection
│   │   ├── student/page.tsx           # Student dashboard
│   │   └── teacher/page.tsx           # Teacher dashboard
│   ├── components/
│   │   ├── AuthContext.tsx            # Auth context with Clerk
│   │   └── ClientLayout.tsx           # ClerkProvider wrapper
│   └── pages/
│       ├── StudentDashboard.tsx       # Student dashboard component
│       └── TeacherDashboard.tsx       # Teacher dashboard component
├── config/
│   └── db.ts                          # MongoDB connection
└── models/
    └── User.ts                        # User model with roles
```

## Authentication Flow

1. **Sign Up**: User fills signup form → Clerk creates user → Webhook fires
2. **Webhook**: Syncs Clerk user data to MongoDB
3. **Role Selection**: User selects teacher/student on onboarding page
4. **Clerk Metadata**: Role stored in Clerk public metadata via `unsafeMetadata`
5. **Dashboard Access**: AuthContext reads role from Clerk and shows appropriate dashboard

## API Routes

### POST `/api/webhooks/clerk`
- **Purpose**: Syncs user data from Clerk to MongoDB
- **Triggered by**: Clerk on user.created, user.updated, user.deleted
- **No auth required**: Verified via webhook signature

### GET `/api/user/profile`
- **Purpose**: Get current user's profile from MongoDB
- **Auth**: Clerk auth required
- **Returns**: User data with role

### PUT `/api/user/role`
- **Purpose**: Update user's role in MongoDB
- **Auth**: Clerk auth required
- **Body**: `{ "role": "teacher" | "student" }`

## Middleware Protection

Routes protected by [src/middleware.ts](src/middleware.ts):
- `/dashboard/*` - Requires authentication
- `/api/*` - Requires authentication for protected routes

Public routes:
- `/` - Home page
- `/auth/sign-in` - Login
- `/auth/sign-up` - Signup
- `/courses` - Course catalog (if public)

## User Model (MongoDB)

```typescript
{
  _id: string;           // Clerk user ID
  email: string;         // User email
  name: string;          // Full name
  imageUrl?: string;     // Profile image
  role: 'teacher' | 'student';
  bio?: string;
  headline?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Using Authentication in Components

### Get current user and role:
```tsx
import { useAuth } from '@/app/components/AuthContext';

export function MyComponent() {
  const { user, userRole, isLoading } = useAuth();
  
  if (isLoading) return <p>Loading...</p>;
  if (!user) return <p>Please log in</p>;
  
  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <p>Role: {userRole}</p>
    </div>
  );
}
```

### Protect component based on role:
```tsx
const { user, userRole } = useAuth();

if (userRole !== 'teacher') {
  return <p>Teachers only</p>;
}

// Teacher-only content
```

## Next Steps

1. ✅ Install dependencies: `npm install @clerk/nextjs mongoose svix`
2. ✅ Create `.env.local` with Clerk and MongoDB keys
3. ✅ Test signup/login flow
4. ✅ Create more features:
   - Course model and routes
   - Enrollment system
   - Progress tracking
   - Certificates
   - Admin dashboard

## Troubleshooting

### Users not syncing to MongoDB
- Check webhook secret is correct in `.env.local`
- Verify webhook URL is publicly accessible
- Check Clerk webhook logs for errors

### Middleware blocking public pages
- Update matcher in `src/middleware.ts` to exclude your public routes

### Role not persisting
- Ensure webhook is syncing users correctly
- Check MongoDB connection with `npm run dev`
- See browser console for errors

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Mongoose Documentation](https://mongoosejs.com)
