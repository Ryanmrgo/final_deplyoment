# AlinHub LMS – Setup Guide

Get the charity-based learning platform running with Clerk auth and MongoDB.

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier)
- Clerk account (free tier)

## 1. Install Dependencies

```bash
npm install
```

## 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### Required Variables

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | Clerk secret key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `CLERK_WEBHOOK_SECRET` | Webhook signing secret | Clerk Dashboard → Webhooks (see below) |
| `MONGODB_URI` | MongoDB connection string | [MongoDB Atlas](https://cloud.mongodb.com) → Connect → Drivers |

### MongoDB Atlas

1. Create a cluster at https://cloud.mongodb.com
2. Create a database user (Database Access)
3. Add your IP to Network Access (or `0.0.0.0/0` for dev)
4. Connect → Drivers → Copy connection string
5. Replace `<password>` with your user password
6. Example: `mongodb+srv://user:pass@cluster.mongodb.net/alinhub`

### Clerk Webhook (user sync to MongoDB)

1. Clerk Dashboard → Webhooks → Add Endpoint
2. URL: `https://your-domain.com/api/webhooks/clerk` (use ngrok for local dev)
3. Subscribe to: `user.created`, `user.updated`, `user.deleted`
4. Copy the Signing Secret into `CLERK_WEBHOOK_SECRET`

For local development, webhooks require a tunnel (e.g. ngrok). Users will still be created in Clerk; they’ll sync to MongoDB when the webhook runs (e.g. in production or when using ngrok).

## 3. Run the App

```bash
npm run dev
```

Open http://localhost:3000

## 4. Test Flow

1. **Sign up** – `/auth/sign-up`
2. **Choose role** – Student or Teacher on onboarding
3. **Student** – Browse courses, enroll, view dashboard
4. **Teacher** – Create courses, manage them in dashboard

## API Routes

| Route | Auth | Description |
|-------|------|-------------|
| `GET /api/courses` | Public | List published courses |
| `GET /api/courses/[id]` | Public | Get single course |
| `POST /api/enrollment` | Student | Enroll in a course |
| `GET /api/student/enrollments` | Student | My enrollments |
| `GET/POST /api/teacher/courses` | Teacher | List/create courses |
| `POST /api/webhooks/clerk` | Webhook | Sync Clerk users to MongoDB |
| `POST /api/user/update-role` | User | Set role (teacher/student) |

## Troubleshooting

- **“User not found” after signup** – Webhook may not have run. Check webhook URL and secret; ensure MongoDB is connected.
- **Enrollment fails** – Verify user has completed onboarding and chosen “Student”.
- **Courses not loading** – Ensure `MONGODB_URI` is correct and MongoDB Atlas allows your IP.
