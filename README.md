# Fathom Marine - Maritime Operations & Compliance System

A professional, enterprise-grade cloud dashboard for maritime fleet management, safety compliance, and operational maintenance tracking.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB Database
- npm or yarn

### 1. Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on the environment requirements:
   ```env
   PORT=5000
   DATABASE_URL="mongodb+srv://..."
   JWT_SECRET="your_secret_key"
   ```
4. Sync the database schema:
   ```bash
   npm run db:push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```env
   VITE_API_URL="http://localhost:5000/api"
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🏗️ Architecture Decisions

### 1. Tech Stack
- **Frontend:** React 19 + Vite + TypeScript.
- **Backend:** Node.js + Express + TypeScript.
- **ORM:** Prisma (Client & Engine).
- **Database:** MongoDB (Scalable NoSQL).
- **Styling:** Vanilla CSS (Custom professional maritime theme).

### 2. Design Patterns
- **Controller-Route Pattern:** Separation of concerns between routing and business logic.
- **RBAC (Role-Based Access Control):** Granular permissions for `ADMIN` and `CREW`.
- **Protected Routes:** Middleware-based authentication using JWT.

### 3. Data Strategy
- **Prisma with MongoDB:** Leveraging Prisma's type safety while benefiting from MongoDB's flexible schema for complex maritime logs.
- **Relational Integrity:** Emulated through Prisma's connection fields for Ship-to-User and Ship-to-Task relationships.

---

## 🛠️ Key Features
- **Maritime Dashboard:** Real-time compliance monitoring and fleet statistics.
- **Fleet Management:** CRUD operations for ships and vessel metadata.
- **Crew Management:** Role-based access and ship assignments.
- **Maintenance Tracking:** Task scheduling, priority management, and overdue alerts.
- **Safety Drills:** Scheduling, attendance tracking, and missed drill reporting.
