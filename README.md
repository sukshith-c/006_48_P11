# 🍽️ Food Safety Inspection Portal
### Government of India — Digital Food Safety Management System
**Hackathon Problem P11 | MERN Stack | Parts C & D**

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local) OR MongoDB Atlas URI

### 1. Start the Backend
```bash
cd food-safety-portal/server
cp ../.env.example .env          # Edit MONGODB_URI if needed
npm install
npm start
# → API running at http://localhost:5000
# → Database auto-seeds on first start
```

### 2. Start the Frontend
```bash
cd food-safety-portal/client
npm install
npm run dev
# → App running at http://localhost:5173
```

### 3. Run Tests
```bash
cd food-safety-portal/server
npm test
```

---

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin / District Officer** | admin@foodsafety.gov.in | Admin@123 |
| **Inspector** | inspector@foodsafety.gov.in | Inspector@123 |
| **Handler (Zone 1 Primary)** | h1p@foodsafety.gov.in | Handler@123 |

---

## 🏗️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router DOM v6 |
| Styling | Custom CSS (Government theme), Lucide Icons |
| Charts | Recharts |
| HTTP Client | Axios with JWT interceptor |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT + bcrypt |
| Testing | Jest + Supertest |
| Validation | DFA + Regex (BCS503 Automata) |
| Routing | 6-Zone dispatch (BCS502 Networks) |

---

## 📁 Project Structure

```
food-safety-portal/
├── client/                      # React Frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── Badges.jsx       # Category/Status/Assignment badges
│       │   ├── ProtectedRoute.jsx
│       │   └── Sidebar.jsx      # Role-based navigation
│       ├── context/
│       │   ├── AuthContext.jsx  # JWT auth state
│       │   └── ToastContext.jsx # Toast notifications
│       ├── dashboards/
│       │   ├── AdminDashboard.jsx
│       │   ├── AllReports.jsx
│       │   ├── AnalyticsDashboard.jsx  # Recharts
│       │   ├── HandlerDashboard.jsx
│       │   ├── ReportSubmission.jsx    # DFA/Regex feedback
│       │   ├── RoutingDashboard.jsx    # 6-Zone management
│       │   ├── TestingDashboard.jsx    # 22-test runner
│       │   └── UserDashboard.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   └── NotFound.jsx
│       └── services/
│           └── api.js           # Axios + JWT interceptor
│
└── server/                      # Express.js Backend
    ├── config/
    │   ├── db.js                # MongoDB connection
    │   └── seed.js              # Demo data seeder
    ├── controllers/             # Route handlers
    ├── middleware/
    │   ├── auth.js              # JWT verification
    │   ├── authorize.js         # Role-based access
    │   └── errorHandler.js
    ├── models/                  # Mongoose schemas
    │   ├── User.js
    │   ├── Report.js            # Full report schema
    │   ├── Handler.js
    │   ├── Zone.js
    │   ├── RoutingDecision.js
    │   ├── StatusHistory.js
    │   └── ClassificationRule.js
    ├── routes/                  # Express routers
    ├── services/
    │   ├── dfaService.js        # BCS503: DFA + Regex validation
    │   ├── classificationService.js
    │   ├── dispatchService.js   # BCS502: 6-zone routing
    │   └── reportIdService.js
    ├── tests/
    │   └── validation.test.js  # 22 Jest test cases
    └── validators/
```

---

## 🔗 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public |
| GET | `/api/auth/profile` | Private |

### Reports
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/reports` | Inspector, Admin |
| GET | `/api/reports` | All |
| GET | `/api/reports/:id` | All |
| GET | `/api/reports/search/:reportId` | All |
| PUT | `/api/reports/:id/status` | Handler, Admin |

### Routing
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/routing/zones` | Admin |
| GET | `/api/routing/table` | Admin |
| GET | `/api/routing/queue` | Admin |
| GET | `/api/routing/decisions` | Admin |
| POST | `/api/routing/dispatch` | Admin |

### Analytics
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/analytics/summary` | All |
| GET | `/api/analytics/categories` | All |
| GET | `/api/analytics/zones` | All |
| GET | `/api/analytics/status` | All |
| GET | `/api/analytics/handlers` | All |

### Tests
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/tests/run` | Admin |
| GET | `/api/tests/results` | Admin |

---

## 🧬 Automata Theory Integration (BCS503)

### Inspector ID — DFA
```
Language: INS[A-Z]{2}[0-9]{4}
Example:  INSAB1234

States: q0 → q1(I) → q2(N) → q3(S) → q4(A-Z) → q5(A-Z) → q6(0-9) → q7(0-9) → q8(0-9) → q9(0-9) ✓ACCEPT
Reject state: q_reject (all invalid inputs)
```

### Violation Code — DFA
```
Language: V[0-9]{2}-(CRITICAL|MAJOR|MINOR|ADVISORY|PASSED)
Example:  V01-CRITICAL

States: v0 → v1(V) → v2(0-9) → v3(0-9) → v4(-) → v_accept(CATEGORY) ✓ACCEPT
Reject state: v_reject
```

Both DFA and Regex validations run independently. The system reports whether they **agree** or **disagree** and provides the full state transition trace.

---

## 🌐 6-Zone Routing (BCS502)

| Zone | Region | PIN Prefix |
|------|--------|-----------|
| Zone 1 | Bangalore North | 56xxxx |
| Zone 2 | Mysore Region | 57xxxx |
| Zone 3 | Mangalore Region | 58xxxx |
| Zone 4 | Hubli-Dharwad | 59xxxx |
| Zone 5 | Chennai Region | 60xxxx |
| Zone 6 | Coimbatore Region | 61xxxx |

### Dispatch Algorithm
```
1. Extract PIN code from validated report
2. Identify zone by PIN prefix
3. Check primary officer availability
4. Check primary officer capacity (< 10 open cases)
5. If unavailable/at capacity → try deputy
6. If both unavailable → waiting queue
7. CRITICAL reports → emergency escalation override
8. Unknown PIN codes → central correction queue
9. MongoDB transaction prevents duplicate assignment
```

---

## 📊 Status Workflow

```
Pending → Assigned → In Progress → Resolved
```
Invalid transitions are rejected by the backend.

---

## ✅ Testing (22 Test Cases)

```bash
cd server && npm test
```

Test coverage:
- DFA validation (valid/invalid Inspector IDs)
- DFA validation (valid/invalid Violation Codes)
- Regex validation agreement
- Classification logic (all 5 categories)
- Priority calculation
- Dispatch routing logic
- Status transition validation
- Edge cases (malformed, incomplete, conflicting)

---

## 🎨 Role-Based Dashboards

| Role | Access |
|------|--------|
| **Admin** | All dashboards, Routing Management, User Management, Analytics, All Reports, Testing |
| **Inspector** | Submit Reports, My Dashboard, Analytics |
| **Handler** | Handler Dashboard (assigned cases, status updates), Analytics |

---

## 🏷️ Category Colors

| Category | Color | Priority |
|----------|-------|----------|
| Critical | 🔴 Red | 1 (Highest) |
| Major | 🟠 Orange | 2 |
| Minor | 🟡 Yellow | 3 |
| Advisory | 🔵 Blue | 4 |
| Passed | 🟢 Green | 5 |

---

## 📝 Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/food_safety_portal
PORT=5000
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

*Built for Hackathon Problem P11 — Satisfies Parts C (Frontend & Web Application) and D (Testing & Integration)*
