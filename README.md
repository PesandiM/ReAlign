# ReAlign: AI powered treatment prediction and appointment scheduling optimizer for The Chiro House

ReAlign is a full-stack web application that combines AI-driven symptom analysis with appointment scheduling and staff management for a chiropractic clinic. Patients can check symptoms and receive treatment recommendations powered by machine learning, while staff and admins manage appointments, therapists, and availability through a dedicated portal.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Material UI |
| Backend | FastAPI (Python 3.11+) |
| Database | MongoDB Atlas (Motor async driver) |
| ML Models | Scikit-learn — TF-IDF, SVD, Random Forest |
| Auth | JWT (PyJWT) + bcrypt password hashing |
| Email | Gmail SMTP (smtplib) |
| API Docs | Swagger UI — `/docs` |

---

## Project Structure

```
ReAlign/
├── backend/
│   ├── run.py                  # Entry point — starts uvicorn
│   ├── .env                    # Environment variables (see below)
│   └── app/
│       ├── main.py             # FastAPI app, CORS, router registration
│       ├── core/
│       │   ├── config.py       # Settings loaded from .env
│       │   └── database.py     # MongoDB Motor connection
│       └── api/
│           ├── endpoints/
│           │   ├── auth.py         # Register, login, forgot/reset password
│           │   ├── patients.py     # Patient profiles, appointments
│           │   ├── staff.py        # Staff dashboard, appointment approval
│           │   ├── therapists.py   # Therapist CRUD + availability
│           │   ├── treatments.py   # Treatment catalogue
│           │   └── predictions.py  # AI symptom analysis
│           └── services/
│               ├── ml_service.py       # ML model loading and inference
│               └── email_service.py    # Gmail SMTP email functions
└── frontend/
    ├── public/
    └── src/
        ├── pages/
        │   ├── HomePage.tsx
        │   ├── PatientDashboard.tsx
        │   └── StaffDashboardPage.tsx
        ├── components/
        │   ├── common/         # AppSidebar, Header
        │   ├── patient/        # SymptomChecker, BookAppointmentDialog
        │   └── staff/          # AppointmentManagement, TherapistAvailability
        └── services/
            ├── authService.ts
            ├── patientService.ts
            └── staffService.ts
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm 9+
- A MongoDB Atlas account (free tier works)
- A Gmail account with an App Password enabled

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/PesandiM/ReAlign.git
cd ReAlign
```

---

### 2. Backend Setup

#### Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### Create `.env` file

Create a file at `backend/.env` with the following content:

```env
# MongoDB Atlas
MONGODB_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=ReAlign-Cluster
DATABASE_NAME=realign_db

# App
APP_NAME=ReAlign API
APP_VERSION=1.0.0
DEBUG=True

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ML Models — absolute path to the folder containing the .pkl files
MODELS_DIR=C:\Users\DELL\Desktop\BSc\ReAlign\Models

# Gmail SMTP
SMTP_EMAIL=your-gmail@gmail.com
SMTP_PASSWORD=your-app-password
```

> **Gmail App Password:** Go to your Google Account → Security → 2-Step Verification → App Passwords. Generate a password for "Mail" and paste it as `SMTP_PASSWORD`. Do **not** use your regular Gmail password.

#### Start the backend

```bash
cd backend
python run.py
```

The API will be available at `http://localhost:8000`  
Swagger docs: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend will be available at `http://localhost:3001`

> If it starts on port 3000, the backend CORS is already configured to allow both `3000` and `3001`.

---

### 4. ML Models

The ML models are not included in the repository due to file size. Place the following `.pkl` files in the directory specified by `MODELS_DIR` in your `.env`:

```
Models/
├── model1_tfidf.pkl          # Severity prediction — TF-IDF vectoriser
├── model1_model.pkl          # Severity prediction — classifier
├── model2_tfidf.pkl          # Similarity engine — TF-IDF vectoriser
├── model2_svd.pkl            # Similarity engine — SVD transformer
├── model2_similarity_engine.pkl   # Similarity engine — embeddings + metadata
├── model3_rf.pkl             # Treatment recommendation — Random Forest
├── model3_tfidf.pkl          # Treatment recommendation — TF-IDF
├── model3_scaler.pkl         # Treatment recommendation — feature scaler
└── model3_label_encoder.pkl  # Treatment recommendation — label encoder
```

---

## MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Add a database user with read/write access
3. Whitelist your IP address (or use `0.0.0.0/0` for development)
4. Copy the connection string into `MONGODB_URL` in your `.env`

The application creates the following collections automatically on first use:

| Collection | Purpose |
|---|---|
| `users` | Authentication accounts |
| `patients` | Patient profiles |
| `appointments` | Booking records |
| `therapists` | Therapist profiles and specialities |
| `treatments` | Treatment catalogue |
| `availability` | Therapist availability slots |
| `symptoms` | Symptom check records (logged-in patients) |
| `recommendations` | AI recommendation records |
| `guest_symptoms` | Symptom checks from anonymous users |
| `guest_recommendations` | Recommendations for anonymous users |
| `password_resets` | OTP records for forgot password flow |
| `notifications` | Email/SMS notification log |

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new patient |
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/forgot-password` | Request OTP reset email |
| POST | `/api/auth/reset-password` | Verify OTP and set new password |
| GET | `/api/v1/patients/{id}` | Get patient profile |
| POST | `/api/v1/patients/{id}/appointments/request` | Book appointment |
| GET | `/api/v1/patients/{id}/appointments/upcoming` | Upcoming appointments |
| GET | `/api/v1/patients/{id}/appointments/past` | Past appointments |
| POST | `/api/v1/predict/complete` | Full AI symptom analysis |
| GET | `/api/v1/staff/appointments/pending` | Pending appointment requests |
| PUT | `/api/v1/staff/appointments/{id}/approve` | Approve appointment |
| PUT | `/api/v1/staff/appointments/{id}/reject` | Reject appointment |
| GET | `/api/v1/staff/therapists` | List therapists |
| POST | `/api/v1/staff/therapists/{id}/availability` | Add availability slot |

Full interactive documentation available at `http://localhost:8000/docs`

---

## User Roles

| Role | Access |
|---|---|
| **Patient** | Symptom checker, book appointments, view history, manage profile |
| **Staff** | View and approve/reject appointments, manage therapist availability |
| **Admin** | All staff access + user management, analytics, treatment management |

---

## Email Notifications

The system sends emails via Gmail SMTP for:

- **OTP code** — when a patient requests a password reset
- **Appointment requested** — confirmation to patient on booking
- **Appointment confirmed** — when staff approves a request
- **Appointment rejected** — with optional reason from staff

Emails are sent asynchronously in a thread executor so they do not block API responses.

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `MONGODB_URL` | MongoDB Atlas connection string |
| `DATABASE_NAME` | Database name (e.g. `realign_db`) |
| `SECRET_KEY` | JWT signing secret — change in production |
| `ALGORITHM` | JWT algorithm — `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime in minutes |
| `MODELS_DIR` | Absolute path to ML model `.pkl` files |
| `SMTP_EMAIL` | Gmail address for sending emails |
| `SMTP_PASSWORD` | Gmail App Password (not your account password) |

---

## Common Issues

**Backend won't start — `ModuleNotFoundError`**  
Make sure you're running `python run.py` from inside the `backend/` directory, not the repo root.

**ML models not loading**  
Check that `MODELS_DIR` in `.env` is the correct absolute path and all 8 `.pkl` files are present. Check uvicorn logs for `❌ Module` errors on startup.

**MongoDB connection refused**  
Verify your Atlas cluster is running, your IP is whitelisted, and the connection string credentials are correct.

**Emails not sending**  
Ensure 2-Step Verification is enabled on your Gmail account and you're using a generated App Password, not your regular password.

**CORS errors in browser**  
The backend allows `localhost:3000` and `localhost:3001`. If your frontend runs on a different port, add it to `allow_origins` in `main.py`.

---

## License

This project was developed as an academic submission for CIS6035 at Cardiff Metropolitan University / ICBT Campus.
