# RetainAI: The 360° Customer Intelligence Platform
## A Hybrid Data Science & Machine Learning Real-World Project

### 🎯 Objective
To build an end-to-end "Customer Retention System" that not only **analyzes** past behavior (Data Science) but also **predicts** future churn risk (Machine Learning) and recommends actions (AI), presented in a professional dashboard.

---

### 🛠️ Tech Stack (2026 Standards)
- **Core:** Python 3.11+
- **Data & Analytics (The "Science"):** Pandas, NumPy, Plotly (Interactive Viz), Scikit-Learn (K-Means Clustering).
- **Machine Learning (The "Prediction"):** XGBoost/CatBoost (SOTA for Tabular), SHAP (Model Explainability), Optuna (Hyperparameter Tuning).
- **Backend (The "Brain"):** FastAPI (High-performance API), Pydantic (Data Validation).
- **Frontend (The "Face"):** React (Vite), TailwindCSS, Recharts/Tremor (Charts), Glassmorphism UI.
- **Operations:** Docker (Containerization).

---

### 🗺️ Project Roadmap

#### Phase 1: Data Science Core & API (The Backend)
**Goal:** Build the engine that processes data and serves predictions.
- [ ] **Data Pipeline:** Ingest Telco/E-commerce data, clean, and store in `data/processed`.
- [ ] **ML Training:** Train XGBoost Churn Model & K-Means Clustering. Save artifacts.
- [ ] **FastAPI Setup:** Create endpoints:
    - `GET /stats`: Returns aggregate business metrics.
    - `POST /predict`: Takes one customer dict, returns Churn Probability + SHAP explanation.
    - `POST /segment`: Returns Cluster assignment for a customer.

#### Phase 2: React Frontend (The Dashboard)
**Goal:** A "Wow" factor UI.
- [ ] **Setup:** Initialize Vite + React project.
- [ ] **Dashboard:** Create a beautiful Analytics card layout (Total Churn, Revenue at Risk).
- [ ] **Interactive Visuals:** Use Recharts to show Churn Trends and Cluster distributions.
- [ ] **Prediction Form:** A form where you type customer details -> Get "Risk Score" gauge.
- [ ] **Simulator:** "What-If" sliders (Adjust Price -> See Risk drop).

#### Phase 3: Integration & Polish
- [ ] **Connect:** Fetch data from FastAPI to React.
- [ ] **Professional UI:** Add Dark Mode, Loading States, Error Handling.
- [ ] **Documentation:** README showing how to run both servers.

---

### 📂 Directory Structure
```
RetainAI/
├── backend/                # Python FastAPI Backend
│   ├── data/               # CSVs and Artifacts
│   ├── models/             # Saved .pkl models
│   ├── src/                # Logic (preprocessing, training)
│   ├── main.py             # FastAPI App
│   └── requirements.txt
├── frontend/               # React Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/       # API calls
│   └── package.json
└── README.md
```
