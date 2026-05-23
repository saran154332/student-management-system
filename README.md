# Student Management System

A full-stack student management application with authentication, role-based access, student records, dashboard stats, audit logs, Excel import/export, image uploads, and password reset by email code.

## Tech Stack

- Frontend: React, Vite, Redux Toolkit, React Router, Axios
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT, bcrypt, Google OAuth 2.0, Passport
- Email: Nodemailer
- Files: Multer uploads
- Excel: ExcelJS and XLSX

## Project Structure

```text
student management system/
  backend/
    controllers/
    config/
    middleware/
    models/
    routes/
    uploads/
    server.js
  frontend/
    src/
    public/
```

## Features

- User registration and login
- Google OAuth login
- Admin and teacher roles
- JWT protected routes
- Password reset flow:
  - User enters email
  - Backend sends reset code
  - User verifies code
  - User sets new password
- Student CRUD
- Student photo upload
- Dashboard statistics
- Audit logs
- Excel import and export

## Prerequisites

- Node.js
- npm
- MongoDB database
- Gmail app password or SMTP credentials for email sending
- Google OAuth client ID and client secret

## Backend Setup

1. Go to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
CLIENT_URL=http://localhost:5173
```

4. In Google Cloud Console, add this authorized redirect URI:

```text
http://localhost:5000/auth/google/callback
```

5. Start the backend:

```bash
npm run dev
```

The backend runs at:

```text
http://localhost:5000
```

## Frontend Setup

1. Go to the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the frontend:

```bash
npm run dev
```

The frontend usually runs at:

```text
http://localhost:5173
```

## Main API Routes

Auth:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/google
GET  /auth/google/callback
POST /api/auth/request-reset
POST /api/auth/verify-reset-code
POST /api/auth/reset-password
```

Login options:

```text
Email/password login returns a JWT directly.
Google login redirects through Google, then returns to the frontend at /oauth-success.
New Google users are created with the teacher role by default.
Existing users keep their current role when linked with Google by email.
```

Students:

```text
GET    /api/students
POST   /api/students
GET    /api/students/:id
PUT    /api/students/:id
DELETE /api/students/:id
```

Audit:

```text
GET /api/audit
```

## Notes

- Do not commit `.env` files.
- Uploaded files are stored in `backend/uploads`.
- For Gmail, use an app password instead of your normal account password.
- Keep Google client secrets private and rotate them if they are exposed.

## Build Frontend

```bash
cd frontend
npm run build
```
