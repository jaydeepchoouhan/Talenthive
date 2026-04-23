# TalentHive

A full-stack real-time social website starter inspired by an Internshala-style student platform.

## What this project includes

- Public feed where users can:
  - upload pictures and videos
  - like posts
  - comment on posts
  - share posts
  - connect with other users as friends
- Posting limit rules:
  - 0 or 1 friend -> 1 post per day
  - 2 to 10 friends -> 2 posts per day
  - more than 10 friends -> unlimited posting
- Forgot password flow:
  - reset using email or phone number
  - only 1 forgot-password request allowed per day
  - if user tries again the same day, backend returns a warning message
- Password generator:
  - generates only uppercase and lowercase letters
  - no numbers
  - no special characters
- Real-time updates using Socket.IO
- Modern UI with gradient cards and responsive layout

## Tech stack

### Frontend
- React + Vite
- Tailwind CSS
- Axios
- React Router
- Socket.IO client

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT authentication
- bcryptjs
- Socket.IO
- Nodemailer for email reset
- Twilio-ready SMS reset support with mock mode for development
- Cloudinary-ready media upload support with local upload fallback

## Free deployment options

This project is designed so you can deploy it using free tiers:

- Frontend: Vercel or Netlify
- Backend: Render
- Database: MongoDB Atlas free tier
- Media: Cloudinary free tier
- Email reset: Gmail SMTP or Brevo SMTP
- Phone reset: Twilio integration is prepared, but free production SMS is usually limited; mock mode is included for development

## Folder structure

```bash
talenthive/
  backend/
  frontend/
  README.md
```

## Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Backend environment variables

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/talenthive
USE_IN_MEMORY_DB=false
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
JWT_SECRET=change_me_super_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMS_MODE=mock
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Deep-link rewrites for Vercel and Netlify are included in the `frontend/` app so routes like `/login` and `/posts/:postId` keep working after deployment.

### Frontend environment variables

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Important business logic implemented

### Posting rule

The backend checks how many friends the user has before allowing a new post.

- less than 2 friends -> 1 per day
- 2 to 10 friends -> 2 per day
- more than 10 friends -> unlimited

This rule is enforced on the server, so users cannot bypass it from the browser UI.

### Forgot password rule

The backend stores the last forgot-password request date.

- one request is allowed per day
- second request on the same day returns:
  - `Warning: you can use forgot password only one time per day.`

### Password generator rule

The password generator uses only:
- `a-z`
- `A-Z`

It does not use numbers or symbols.

## Development notes

### Email reset
If SMTP is not configured, the reset code is logged in the backend terminal for testing.

### Phone reset
If Twilio is not configured, the reset code is logged in the backend terminal for testing.

### Media uploads
- If Cloudinary is configured, uploaded media goes to Cloudinary.
- If Cloudinary is not configured, files are stored in the local `uploads/` folder.
- For production deployments on ephemeral hosts, configure Cloudinary so uploaded media persists across restarts and redeploys.

### Local database fallback
- Set `USE_IN_MEMORY_DB=true` in `backend/.env` to run the backend without installing MongoDB locally.
- The in-memory database is intended for development only and resets whenever the backend restarts.

## Core API routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/password-generator`

### Users
- `GET /api/users`
- `POST /api/users/friend-request/:targetUserId`
- `POST /api/users/accept-request/:requesterId`

### Posts
- `GET /api/posts`
- `GET /api/posts/posting-status`
- `GET /api/posts/:postId`
- `POST /api/posts`
- `POST /api/posts/:postId/like`
- `POST /api/posts/:postId/comment`
- `POST /api/posts/:postId/share`

## Freely deployable production path

### Recommended stack
- frontend -> Vercel
- backend -> Render
- database -> MongoDB Atlas
- media -> Cloudinary
- email -> Brevo or Gmail SMTP

### Deployment flow
1. Push backend and frontend to GitHub.
2. Create MongoDB Atlas free cluster.
3. Create Cloudinary free account.
4. Deploy backend on Render and set backend env variables.
5. Deploy frontend on Vercel and set frontend env variables.
6. Update `CLIENT_URL`, `SERVER_URL`, `VITE_API_URL`, and `VITE_SOCKET_URL` with deployed URLs.
7. Keep `USE_IN_MEMORY_DB=false` in production and use your hosted MongoDB connection string.

## Suggested next upgrades

- OTP verification before registration completion
- Notification center for likes and comments
- Search users by name
- User profile page
- Internship/job module on top of this social layer
- Cloudinary folder organization and delete support
- Admin dashboard
- Rate limiting middleware

## Note

This is a strong starter project and covers your requested rules and UI flow. For production use, you should add:
- stronger validation
- refresh tokens
- input sanitization
- pagination
- message queues for email/SMS
- content moderation
