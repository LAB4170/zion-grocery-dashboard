# Nexus POS Pro (Cloud-Native & Multitenant)

Nexus POS is a modern, high-performance Point of Sale and Inventory Management system designed for versatile business needs. It features a robust multitenant architecture, real-time data synchronization, and industrial-grade inventory logic.

## 🚀 Key Features

### 🏢 Unified Multitenancy
- **Business Isolation**: Every business owns its private data silo (Products, Sales, Expenses, Debts).
- **Tenant-Aware Middleware**: Automatic context switching based on the authenticated user's business profile.
- **Scalable Schema**: Shared database with strictly enforced `business_id` isolation.

### 📦 Industrial Inventory Logic
- **Unit-Aware Handling**: Differentiates between items sold by piece (`pcs`) and weight/volume (`kg`, `l`, `ml`).
- **Precision Validation**: Enforces whole-number constraints for pieces while allowing decimal precision for weighted goods.
- **Stock Control**: Real-time stock status monitoring with intelligent rounding for different units.

### ⚡ Real-Time Operations
- **Socket.IO Integration**: Instantly syncs sales and inventory updates across all active terminals.
- **Polling Fallback**: High stability across various network environments and proxy setups.

### 🛡️ Security & Compliance
- **Firebase Authentication**: Secure social and email login powered by Google Firebase.
- **KDP & Data Protection**: Built-in Privacy Policy and Terms of Service endpoints to meet Kenyan Data Protection requirements.
- **Sensitive Data Isolation**: `.env` and secret keys are strictly excluded from version control.

---

## 🛠️ Tech Stack

### Backend
- **Core**: Node.js & Express
- **Database**: PostgreSQL (with Knex.js Query Builder)
- **Real-time**: Socket.IO
- **Auth**: Firebase Admin SDK
- **Task Scheduling**: Node-cron (for automated backups)

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Premium Glassmorphism UI (Vanilla CSS)
- **Icons**: Lucide-React
- **Charts**: Recharts for business analytics

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v16+)
- PostgreSQL (v14+)
- Firebase Project (for Authentication)

### 2. Backend Setup
1. Navigate to `/backend`.
2. Install dependencies: `npm install`.
3. Configure `.env` file (see `.env.example` or your existing config):
   ```env
   DB_HOST=localhost
   DB_NAME=EobordTech-POS
   FB_SERVICE_ACCOUNT=path/to/firebase-key.json
   ```
4. Run the manual migration to initialize the schema:
   ```bash
   node manual_schema.js
   ```
5. Start the server:
   ```bash
   npm start
   ```

### 3. Frontend Setup
1. Navigate to `/frontend-react`.
2. Install dependencies: `npm install`.
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```bash
Nexus-POS/
├── backend/
│   ├── config/          # DB and Firebase configurations
│   ├── middleware/      # Auth and Multitenant isolation
│   ├── models/          # Data models (Product, Sale, etc.)
│   ├── routes/          # API Endpoints
│   ├── manual_schema.js # Schema initializer
│   └── server.js        # Main entry point
├── frontend-react/
│   ├── src/
│   │   ├── pages/       # Dashboard, Sales, Inventory view
│   │   ├── components/  # Reusable UI components
│   │   └── context/     # Auth and Business state management
└── scripts/             # Useful automation scripts
```

## 🔐 Maintenance
- **Backups**: The system includes a cron-based backup utility (`evergreen_db.js` logic) to ensure data safety.
- **Schema Updates**: Use `manual_schema.js` for unified updates across tables.

---

## 📄 License
MIT License. Optimized for high-growth businesses in the Kenyan market.
