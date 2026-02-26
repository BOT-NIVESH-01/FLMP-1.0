# 📘 Faculty Leave & Smart Substitution Management System

A full-stack web application for managing faculty leave requests and automatic smart substitution allocation.

This system allows faculty members to apply for leave, automatically finds available substitutes based on timetable and leave data, and enables HOD/Admin to approve, reject, or force-assign substitutes.

---

## 🚀 Features

### 👨‍🏫 Faculty

* Apply for Casual, Medical, or Personal leave
* Automatic smart substitution engine
* View weekly timetable
* Accept / Decline substitution requests
* Track leave history
* Real-time status updates

### 🏢 HOD / Admin

* View pending leave approvals
* Monitor substitution status
* Force assign substitutes if needed
* Faculty availability overview (today)
* Role-based dashboard access

### ⚙️ Smart Substitution Engine

* Checks:

  * Faculty timetable
  * Leave conflicts
  * Slot availability
* Broadcasts requests to all available candidates
* First acceptance wins
* Prevents duplicate slot assignment

---

## 🏗 Project Architecture

```
src/
│
├── api/                 → Axios + API layer
├── components/
│   ├── common/          → Reusable UI components
│   ├── auth/            → Login
│   ├── dashboard/       → Dashboard views
│   ├── leave/           → Leave & substitution
│   ├── timetable/       → Timetable display
│
├── utils/               → Date + substitution engine
│
├── App.jsx              → Main orchestrator
├── index.js
└── App.css
```

---

## 🛠 Tech Stack

### Frontend

* React (Hooks)
* Axios
* Lucide React Icons
* CSS (Custom Styling)

### Backend (Expected)

* Node.js
* Express.js
* MongoDB
* JWT Authentication

---

## 🔐 Authentication

* JWT-based authentication
* Token stored in localStorage
* Axios interceptor attaches token automatically
* Role-based access (Faculty / HOD / Admin)

---

## 🧠 Smart Substitution Logic

The substitution engine:

1. Gets leave date(s)
2. Finds classes requiring substitution
3. Filters faculty:

   * Not the requester
   * Not on leave
   * No timetable conflict
4. Generates substitution requests
5. Removes pending requests if someone already accepted

Located in:

```
src/utils/substitutionEngine.js
```

---

## 📦 Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/yourusername/faculty-leave-system.git
cd faculty-leave-system
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Start frontend

```bash
npm start
```

Runs at:

```
http://localhost:3000
```

---

## 🔌 Backend Requirement

Make sure backend runs at:

```
http://localhost:5000/api
```

Required endpoints:

```
POST   /auth/login
GET    /auth/me
GET    /data/users
GET    /data/leaves
GET    /data/timetable
POST   /data/leaves
PATCH  /data/leaves/:id/status
PATCH  /data/leaves/:id/substitute
PATCH  /data/leaves/:id/force-substitute
```

---

## 📊 Roles & Permissions

| Feature             | Faculty | HOD | Admin |
| ------------------- | ------- | --- | ----- |
| Apply Leave         | ✅       | ✅   | ✅     |
| Accept Substitution | ✅       | ✅   | ✅     |
| Approve Leave       | ❌       | ✅   | ✅     |
| Force Assign        | ❌       | ✅   | ✅     |
| Faculty Overview    | ❌       | ✅   | ✅     |

---

## 🎯 Future Improvements

* TypeScript migration
* React Query integration
* Real-time notifications (Socket.IO)
* Email notifications
* Mobile responsive layout
* Dark mode
* Leave balance auto-deduction logic
* Export leave reports (PDF/Excel)

---

## 🧪 Suggested Test Cases

* Medical leave less than 10 days (should fail)
* Two faculty accept same slot (only first allowed)
* HOD force assign when no substitute
* Leave with multiple date range
* Logout clears token

---

## 🧩 Component Overview

### Core Components

* `Dashboard.jsx`
* `LeaveApplicationForm.jsx`
* `TimetableView.jsx`
* `FacultyOverview.jsx`
* `Sidebar.jsx`

### Common Components

* `ToastContainer.jsx`
* `StatusBadge.jsx`
* `LoaderScreen.jsx`

---

## 🏆 Why This Architecture?

✔ Separation of concerns
✔ Scalable folder structure
✔ Clean API abstraction
✔ Reusable utility functions
✔ Role-based rendering
✔ Maintainable state management

---

