# Auth System — Backend (Node.js + MySQL)

## Live Demo
- API Docs (Swagger): https://YOUR-BACKEND-URL.onrender.com/api-docs
- Frontend: https://YOUR-FRONTEND-URL.onrender.com

## Stack
- Node.js + Express.js
- MySQL 8 (mysql2)
- JWT + Refresh Tokens (HttpOnly cookie)
- Nodemailer (Ethereal auto-account for dev)
- Swagger UI at /api-docs

## Local Setup

### 1. Install
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DB credentials
```

### 2. Run
```bash
npm run dev    # nodemon
npm start      # production
```
DB and tables are auto-created on first start.

Visit: http://localhost:4000/api-docs

## Deployment (Render.com)
1. Create a Web Service, connect GitHub repo
2. Build Command: `npm install`
3. Start Command: `node src/server.js`
4. Add all vars from .env.example in Render dashboard
5. Set CORS_ORIGIN to your deployed Angular frontend URL

## API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /accounts/register | Public | Register |
| POST | /accounts/verify-email | Public | Email verification |
| POST | /accounts/authenticate | Public | Login |
| POST | /accounts/refresh-token | Cookie | Refresh JWT |
| POST | /accounts/revoke-token | Cookie | Logout |
| POST | /accounts/forgot-password | Public | Password reset email |
| POST | /accounts/reset-password | Public | Reset password |
| GET | /accounts | Admin | List all accounts |
| GET | /accounts/:id | Auth | Get by ID |
| PUT | /accounts/:id | Auth | Update |
| DELETE | /accounts/:id | Admin | Delete |

## Security Notes
- JWT_SECRET must be a strong random string in production
- Never commit .env to Git
- CORS_ORIGIN must match deployed frontend URL exactly
