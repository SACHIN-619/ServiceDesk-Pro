# ServiceDesk Pro — Enterprise IT Service Management (ITSM) & Asset Platform

**ServiceDesk Pro** is a production-grade, database-backed full-stack MERN (MongoDB, Express, React, Node.js) IT Service Management (ITSM) and Asset Management platform engineered for enterprise IT operations. It provides strict Role-Based Access Control (RBAC) across 5 user roles, an automated SLA calculation & breach monitoring engine, Groq LLM ticket triage & grounded RAG Knowledge Base recommendations, real-time persistent Socket.IO notifications, hardware/software asset lifecycle tracking, immutable audit trails, and live analytics.

---

## 📊 End-to-End ITSM Operational Architecture

![IT Service Desk Workflow Diagram](IT%20service%20desk%20wrokflow%20of%20service.png)

### Complete Workflow Architecture
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           1. System Administrator                           │
│     [User Provisioning] [Registration Approval] [SLA Policy Governance]     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────┐             ┌──────────────┐
│ 2. Employee     │────────────▶│  IT Ticket   │ (Status: OPEN, Requester: Employee)
│   (Self-Service)│             └──────┬───────┘
└─────────────────┘                    │
                                       ▼
                         ┌───────────────────────────┐
                         │  AI Ticket Classification │ (Groq LLM / Heuristic Fallback)
                         │  - Category Detection     │
                         │  - Priority Prediction    │
                         │  - Root Cause Diagnosis   │
                         └─────────────┬─────────────┘
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │    Dynamic SLA Engine     │
                         │  - responseDueAt (e.g 15m)│
                         │  - resolutionDueAt (2h)   │
                         └─────────────┬─────────────┘
                                       │
                                       ▼
┌─────────────────┐             ┌──────────────┐
│ 3. IT Manager   │────────────▶│  Assignment  │ (Status: ASSIGNED)
│ (Command Center)│             └──────┬───────┘
└─────────────────┘                    │
                                       ▼ (Real-Time Socket.IO + MongoDB Notification)
┌─────────────────┐             ┌──────────────┐
│ 4. Technician   │◀────────────│  Work Queue  │
└────────┬────────┘             └──────────────┘
         │
         ├────────────────────────────────────────┐
         ▼                                        ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  Grounded RAG Knowledge Base │        │     IT Asset Tracking        │
│  - MongoDB Vector/Text Search│        │  - Serial Number & Specs     │
│  - Groq Synthesized Solution │        │  - Maintenance & Cost Logs   │
│  - Strict Source KB Citation │        │  - Linked Incident Tickets   │
└────────┬─────────────────────┘        └──────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Ticket Workflow │  ASSIGNED ──▶ IN_PROGRESS ──▶ RESOLVED
└────────┬────────┘
         │
         ▼ (Real-Time Notification to Requester)
┌─────────────────┐
│ 5. Employee     │
│  Confirmation   │
└────────┬────────┘
         │
         ├────────────────────────────────────────┐
         ▼                                        ▼
    [CONFIRM & CLOSE]                         [REOPEN]
   (Status: CLOSED)                       (Status: REOPENED)
                                                  │
                                                  ▼
                                      (Notifies Technician)
```

---

## 🔐 Authentication & Access Security Model

ServiceDesk Pro implements strict backend authorization where roles are derived directly from the authenticated user's verified MongoDB record via JWT tokens.

```text
Public Registration (name, email, password)
                  │
                  ▼
          role: 'EMPLOYEE'
          status: 'PENDING'
                  │
                  ▼
         [Login Attempt] ──▶ Blocked (403 Forbidden: Pending Approval)
                  │
                  ▼
        System Admin Review
           ┌──────┴──────┐
           ▼             ▼
      [APPROVE]      [REJECT]
   status: ACTIVE   status: REJECTED (Login Blocked)
           │
           ▼
     [User Login] ──▶ Verifies bcrypt password hash
                  │
                  ▼
       Generates Signed JWT Token
                  │
                  ▼
        Backend RBAC Middleware
        protect() + authorize(roles)
                  │
     ┌────────────┼────────────┬────────────┬────────────┐
     ▼            ▼            ▼            ▼            ▼
  SYSTEM_ADMIN  IT_MANAGER  TECHNICIAN   EMPLOYEE   ASSET_MANAGER
```

### Privileged User Provisioning
- Privileged accounts (`IT_MANAGER`, `TECHNICIAN`, `ASSET_MANAGER`, `ADMIN`) are provisioned directly by an authenticated System Administrator (`POST /api/users`).
- Ordinary public registration (`POST /api/auth/register`) strictly defaults to `role: 'EMPLOYEE'` with `status: 'PENDING'`.

---

## 👥 Role Workflows & Permissions Matrix

| Feature / Action | EMPLOYEE | TECHNICIAN | IT_MANAGER | ASSET_MANAGER | SYSTEM_ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Create Ticket** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Own Tickets** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Global Ticket Queue** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Assign Technician** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Start Work & Log Time** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Resolve Ticket** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Close / Reopen Ticket** | ✅ (Own) | ❌ | ✅ | ❌ | ✅ |
| **Access RAG Knowledge Base** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Publish Knowledge Articles** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Manage Assets & Repairs** | ❌ | Maintenance | Read/Link | Full CRUD | Full CRUD |
| **Manage SLA Policies** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Approve Registrations** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Provision Privileged Users** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **View Audit Logs & Analytics** | ❌ | ❌ | ✅ | ❌ | ✅ |

### 1. System Administrator
- **Governance**: Approves/rejects pending employee registrations (`PUT /api/users/:id/approve`).
- **User Provisioning**: Provisions staff accounts with designated roles (`POST /api/users`).
- **SLA Governance**: Adjusts response and resolution targets per priority tier (`PUT /api/sla/policies/:id`).
- **Compliance**: Reviews immutable system audit logs (`GET /api/audit`) and global ITSM metrics.

### 2. IT Manager
- **Command Center**: Monitors unassigned tickets, SLA risk queues, and active workloads.
- **Dispatch**: Assigns tickets to available technicians (`PATCH /api/tickets/:id/assign`).
- **Escalation**: Receives automated real-time breach notifications when SLA thresholds are exceeded.

### 3. Technician
- **Assigned Queue**: Views assigned tickets (`GET /api/tickets?myAssigned=true`).
- **Work Logs**: Logs billable troubleshooting minutes with technical notes (`POST /api/tickets/:id/worklog`).
- **Grounded AI RAG**: Queries the internal Knowledge Base for grounded troubleshooting steps and citations.
- **Resolution**: Moves tickets from `IN_PROGRESS` to `RESOLVED` with resolution summaries.

### 4. Employee
- **Self-Service**: Submits tickets with AI classification previews (`POST /api/tickets`).
- **Tracking**: Tracks live status transitions and receives real-time notifications.
- **Resolution Review**: Confirms resolution to `CLOSED` or flags issues to `REOPENED`.

### 5. Asset Manager
- **Lifecycle Tracking**: Manages hardware from `PROCURED` -> `IN_STOCK` -> `ASSIGNED` -> `UNDER_REPAIR` -> `RETIRED`.
- **Assignment**: Associates equipment with staff users.
- **Maintenance & Incidents**: Records repair history, tracks hardware costs, and inspects linked tickets.

---

## 🤖 AI Classification & Grounded RAG Architecture

ServiceDesk Pro centralizes its AI layer in `backend/services/aiService.js` with primary support for **Groq** (`llama-3.3-70b-versatile`) and clean fallback handling.

```text
Ticket Input (Title + Description)
                 │
                 ▼
         AI Classification
                 │
    ┌────────────┴────────────┐
    ▼                         ▼
[Groq LLM Active]     [Fallback Heuristic]
- JSON Schema Prompt  - Pattern matching
- Validated Category  - Default confidence
- Predicted Priority  - Explicit tag:
- isAiGenerated: true   isAiGenerated: false
```

### Grounded Knowledge Base RAG Assistant
```text
Technician opens Ticket
           │
           ▼
1. RETRIEVAL LAYER (MongoDB)
   - Executes $text & regex query across published KnowledgeArticles
   - Applies relevance score threshold (>= 1.5)
           │
           ├──────────────────────────────┐
           ▼                              ▼
   [Articles Found]             [No Matching Articles]
           │                              │
           ▼                              ▼
2. AUGMENTATION & GROQ LLM      Returns honest message:
   - Feeds strict KB context    "No relevant knowledge base
   - Demands source citation     article found in repository."
   - No external hallucinations (Zero hallucinations)
           │
           ▼
3. CITATION-BACKED OUTPUT
   - Actionable troubleshooting steps
   - Clickable source article references
```

---

## 💻 Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | High-performance SPA with responsive layouts |
| **Real-Time Client** | Socket.IO Client | Live bi-directional notification delivery |
| **Visualizations** | Recharts | Dynamic volume trends, category & priority distribution |
| **Icons & Styling** | Lucide-React, Vanilla CSS | Glassmorphism design system with dark/light themes |
| **Backend Runtime** | Node.js (ES Modules), Express | Modular REST API server |
| **Database** | MongoDB & Mongoose | Document database with text indexes & relationship refs |
| **Authentication** | JWT, bcryptjs | Password hashing and secure token-based RBAC |
| **AI / LLM** | Groq API (`llama-3.3-70b-versatile`) | Fast JSON-mode ticket triage and grounded RAG synthesis |
| **Background Jobs** | setInterval / Node-Cron | Periodic SLA breach detection & notification dispatch |

---

## 📁 Project Structure

```text
ServiceDesk IT/
├── README.md                          # Comprehensive Documentation
├── IT service desk wrokflow of service.png # Operational Architecture Diagram
├── backend/                           # Node.js + Express REST API
│   ├── server.js                      # Server entrypoint & Socket.IO initialization
│   ├── config/
│   │   └── db.js                      # MongoDB connection handler
│   ├── models/
│   │   ├── User.js                    # User schema with bcrypt hooks & roles
│   │   ├── Ticket.js                  # Ticket lifecycle schema with SLA timestamps
│   │   ├── Asset.js                   # IT asset inventory & maintenance schema
│   │   ├── SLAPolicy.js               # Configurable SLA priority thresholds
│   │   ├── KnowledgeArticle.js        # Published articles with full-text search indexes
│   │   ├── Notification.js            # Persistent notification schema
│   │   ├── AuditLog.js                # Immutable audit log schema
│   │   └── Category.js                # ITSM incident categories
│   ├── controllers/                   # Business logic controllers
│   ├── middleware/
│   │   ├── authMiddleware.js          # JWT verification & RBAC authorization
│   │   └── errorMiddleware.js         # Global error and 404 handlers
│   ├── routes/                        # Express route declarations
│   ├── services/
│   │   ├── aiService.js               # Groq LLM classifier & Grounded RAG engine
│   │   ├── slaEngine.js               # Deadline calculator & breach monitor
│   │   └── socketService.js           # Real-time WebSocket emitter
│   └── seed/
│       ├── seedData.js                # Initial database seeder
│       └── e2eTest.js                 # Automated end-to-end integration test suite
└── frontend/                          # React + Vite Frontend
    ├── src/
    │   ├── App.jsx                    # Routing & protected route guards
    │   ├── index.css                  # Glassmorphism design system
    │   ├── components/                # UI components (Navbar, Sidebar, Modals, Lists)
    │   ├── context/
    │   │   ├── AuthContext.jsx        # JWT session & authenticated role switcher
    │   │   └── NotificationContext.jsx # Live Socket.IO listeners & toasts
    │   ├── pages/                     # Role-specific dashboards & pages
    │   └── services/
    │       └── api.js                 # Centralized fetch client
    └── package.json
```

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/serviceDesk
JWT_SECRET=servicedesk_super_secret_jwt_key_2026
NODE_ENV=development

# AI / Groq LLM Configuration
AI_ENABLED=true
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Fallback AI Provider (Optional)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
```

---

## 🚀 Installation & Local Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB community server (`mongodb://127.0.0.1:27017`) or MongoDB Atlas

### 2. Backend Installation & Seeding

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Seed development database (Users, SLA policies, Assets, KB articles, Tickets)
npm run seed

# Start backend server
npm start
# -> Listening on port 5000 (Health: http://localhost:5000/api/health)
```

### 3. Frontend Installation & Startup

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
# -> Local app running at http://localhost:5173
```

---

## 🔑 Demo User Credentials (DEVELOPMENT / DEMO ONLY)

The seed script creates 5 pre-configured accounts:

| Role | Email | Password | Account Status |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@servicedesk.com` | `admin123` | `ACTIVE` |
| **IT Manager** | `manager@servicedesk.com` | `manager123` | `ACTIVE` |
| **Technician** | `tech@servicedesk.com` | `tech123` | `ACTIVE` |
| **Employee** | `employee@servicedesk.com` | `employee123` | `ACTIVE` |
| **Asset Manager** | `assetmanager@servicedesk.com` | `asset123` | `ACTIVE` |
| **Pending Employee** | `pending.employee@servicedesk.com` | `employee123` | `PENDING` |

> [!TIP]
> The top header bar includes a **Dev Quick-Login Switcher** that authenticates live against the backend API, acquiring real JWT tokens for each persona.

---

## 🧪 End-to-End Testing & Verification

ServiceDesk Pro includes a full automated test suite covering all workflows, negative RBAC tests, and persistence.

Run the automated integration test suite:
```bash
node backend/seed/e2eTest.js
```

### Test Suite Coverage:
1. **Persona Authentication**: Acquires JWT tokens for all 5 roles.
2. **Database Verification**: Validates `/api/auth/me` against MongoDB.
3. **Public Registration**: Verifies that self-registration creates `EMPLOYEE` with `PENDING` status.
4. **Status Gating**: Validates that `PENDING` accounts are rejected (403) until admin approval (`ACTIVE`).
5. **Security Negative Testing**:
   - Blocks unauthenticated requests with `401`.
   - Blocks Employees from viewing pending accounts, audit logs, or modifying SLA policies with `403`.
   - Blocks Technicians and Asset Managers from user provisioning with `403`.
6. **AI Classification**: Validates category, priority, and confidence outputs.
7. **Grounded RAG**: Verifies KB article retrieval and ensures zero hallucination on unknown topics.
8. **Ticket Lifecycle**: `OPEN` -> `ASSIGNED` -> `IN_PROGRESS` -> `RESOLVED` -> `REOPENED` -> `CLOSED`.
9. **Persistent Notifications**: Verifies MongoDB notification documents and unread count decrements on read.
10. **Asset Management**: Creates hardware asset, assigns it to an employee, and logs maintenance history.
11. **Immutable Audit Trail**: Validates system event capture.
12. **Dynamic Analytics**: Verifies dynamic monthly trends computed from live ticket records.

---

## 📡 Key REST API Endpoints

### Authentication & Users
- `POST /api/auth/register` — Public employee registration (Defaults to `PENDING`).
- `POST /api/auth/login` — Authenticates user, verifies active status, returns JWT.
- `GET /api/auth/me` — Returns current authenticated database user (`protect`).
- `GET /api/users` — Lists users (`ADMIN`, `IT_MANAGER`, `ASSET_MANAGER`, `TECHNICIAN`).
- `GET /api/users/pending` — Lists pending registration approvals (`ADMIN`).
- `PUT /api/users/:id/approve` — Approves registration request (`ADMIN`).
- `PUT /api/users/:id/reject` — Rejects registration request (`ADMIN`).
- `PUT /api/users/profile` — Updates personal name, phone, password (`protect`).

### Tickets & SLA
- `POST /api/tickets` — Creates new ticket with AI triage & SLA deadlines (`protect`).
- `GET /api/tickets` — Queries tickets with role-scoped filters & search (`protect`).
- `GET /api/tickets/:id` — Fetches ticket details with comments, work logs, and asset (`protect`).
- `PATCH /api/tickets/:id/status` — Updates status with role transition rules (`protect`).
- `PATCH /api/tickets/:id/assign` — Assigns technician (`ADMIN`, `IT_MANAGER`).
- `POST /api/tickets/:id/worklog` — Logs technician troubleshooting minutes (`ADMIN`, `IT_MANAGER`, `TECHNICIAN`).
- `POST /api/tickets/:id/comments` — Adds public comment or internal staff note (`protect`).
- `GET /api/sla/policies` — Lists SLA response/resolution policies (`protect`).
- `PUT /api/sla/policies/:id` — Modifies SLA target hours (`ADMIN`, `IT_MANAGER`).

### AI & Knowledge Base
- `POST /api/ai/classify` — Classifies ticket category, priority, and probable cause (`protect`).
- `POST /api/ai/recommend` — Grounded RAG recommendations from KB articles (`protect`).
- `GET /api/kb` — Searches published KB articles (`protect`).
- `POST /api/kb` — Publishes new solution article (`ADMIN`, `IT_MANAGER`, `TECHNICIAN`).
- `POST /api/kb/:id/vote` — Upvotes helpful solution article (`protect`).

### Assets & Governance
- `GET /api/assets` — Lists IT assets with filters (`protect`).
- `POST /api/assets` — Registers new hardware/software asset (`ADMIN`, `ASSET_MANAGER`, `IT_MANAGER`).
- `PUT /api/assets/:id` — Updates asset status, assignment, specs (`ADMIN`, `ASSET_MANAGER`, `IT_MANAGER`).
- `POST /api/assets/:id/maintenance` — Logs repair actions and costs (`ADMIN`, `ASSET_MANAGER`, `TECHNICIAN`).
- `GET /api/notifications` — Fetches user's persistent notifications (`protect`).
- `PUT /api/notifications/:id/read` — Marks notification as read (`protect`).
- `GET /api/audit` — Queries immutable system audit trail (`ADMIN`, `IT_MANAGER`).
- `GET /api/analytics/dashboard` — Live dashboard metrics & dynamic volume trends (`protect`).

---

## 🔒 Production Security Considerations

- **Secrets Isolation**: API keys and JWT secrets are loaded via environment variables and never exposed in client bundles.
- **Strict JWT RBAC**: Authorization middleware verifies identity against MongoDB on every request.
- **Audit Immutability**: Critical lifecycle actions are recorded with timestamps, actor IDs, and IP metadata.
- **Graceful AI Degradation**: System operates with deterministic heuristic fallbacks when AI keys are not configured.
- **Database Persistence**: All operational state (tickets, notifications, assets, audit logs) resides in MongoDB.

---

## 📄 License

MIT License. Designed and engineered for enterprise IT Service Management.
