# ServiceDesk Pro — Backend API

Backend RESTful API and background engines for ServiceDesk Pro ITSM platform built with Node.js, Express, MongoDB (Mongoose), and JWT authentication.

## Features
- **JWT & Role-Based Authorization Middleware**: Enforces roles (`ADMIN`, `IT_MANAGER`, `TECHNICIAN`, `EMPLOYEE`, `ASSET_MANAGER`).
- **SLA Calculation Engine**: Automated calculation of response/resolution deadlines based on ticket priority, with background breach monitoring.
- **AI Classification & RAG**: Heuristic/embedding ticket auto-classifier and Knowledge-Base solution recommendation system.
- **Asset Lifecycle Management**: Tracks hardware/software assets and maintenance history.
- **Audit Logging**: Enterprise traceability for all operations.

## Environment Variables
Create a `.env` file in this directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/servicedesk_db
JWT_SECRET=servicedesk_super_secret_jwt_key_2026
NODE_ENV=development
```

## Available Scripts
- `npm install`: Install dependencies.
- `npm run dev`: Start backend in watch mode.
- `npm run seed`: Populate database with sample enterprise users, tickets, assets, KB articles, and SLA policies.
- `npm start`: Production server start.

## API Endpoints Overview
- `POST /api/auth/login`: User login & JWT issuance
- `GET /api/auth/me`: Current logged-in user profile
- `GET /api/tickets`: List tickets (filtered by role/status/priority)
- `POST /api/tickets`: Create ticket (triggers SLA calculation & AI suggestion)
- `PATCH /api/tickets/:id`: Update ticket status, assignment, work logs, resolution
- `POST /api/ai/classify`: Predict ticket category, priority, and probable cause
- `POST /api/ai/recommend`: AI RAG Knowledge Base articles matching ticket issue
- `GET /api/assets`: Asset inventory & management
- `GET /api/sla/policies`: SLA policies & performance stats
- `GET /api/analytics/dashboard`: Dynamic role metrics & charts data
- `GET /api/audit`: System audit logs
