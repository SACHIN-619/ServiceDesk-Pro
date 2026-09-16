# ServiceDesk Pro — Frontend Web Application

Modern, responsive React single-page application for ServiceDesk Pro ITSM platform featuring 5 distinct role-based dashboards, interactive charts, real-time SLA badges, ticket workflows, AI classification preview, and asset lifecycle management.

## Tech Stack
- **Framework**: React 18 with Vite
- **Icons**: Lucide Icons (`lucide-react`)
- **Charts**: Recharts
- **Design System**: Vanilla CSS with HSL design tokens, Glassmorphism, smooth micro-interactions, dark/light theme options, and custom responsive layouts.

## Key Views & Features
1. **Header Role Switcher Bar**: Live interactive role toggler for instant previewing of all 5 role perspectives:
   - 👑 `System Admin`
   - 👨‍💼 `IT Manager`
   - 🧑‍💻 `Technician`
   - 👤 `Employee`
   - 🖥️ `Asset Manager`
2. **Ticket Command Center**: Filter by Priority, Status, SLA state, Category, Requester, or Technician.
3. **AI Classification & RAG Panel**: Live AI ticket preview analyzing ticket text for auto-category, priority, probable issue, and recommending KB articles.
4. **SLA Breach Monitoring**: Real-time SLA badge indicators (Overdue, Warning, On Track).
5. **Asset Inventory**: Hardware/software lifecycle status flow (`PROCURED` -> `IN_STOCK` -> `ASSIGNED` -> `UNDER_REPAIR` -> `RETIRED`).
6. **Audit Logs Viewer**: Full audit trail table with filterable action logs.

## Setup Instructions
```bash
npm install
npm run dev
```
Application will be available at `http://localhost:5173`.
