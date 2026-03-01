# 🐔 ChickTech — AI-Powered Chicken Disease Diagnosis

## 🐣 About

**ChickTech** is an AI-powered chicken disease diagnosis platform that leverages **deep learning** to identify poultry diseases. It combines a powerful **Flask backend** for AI inference and a **Next.js frontend** for an interactive, cinematic user experience.

The platform provides:
- **Real-time Disease Detection:** Using trained CNN models for Coccidiosis and External Lesions.
- **External Lesion Detection:** New module for identifying **Fowlpox** and **Bumblefoot** with high accuracy.
- **Cinematic UI:** Interactive fluid simulation (Splash Cursor) and smooth GSAP animations.
- **Comprehensive Recovery Guides:** Dynamic, doctor-level treatment and prevention protocols for each detected disease.
- **Cloud-Ready:** Scalable architecture ready for deployment on Render, AWS, or Azure.

---

## 🚀 Tech Stack

| Layer | Technologies Used |
|-------|--------------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, GSAP, OGL (WebGL) |
| **Backend / API** | Flask (Python), TensorFlow 2.x, Scikit-learn |
| **Machine Learning** | MobileNetV2 (Transfer Learning), OpenCV |
| **Database / Auth** | Firebase (Firestore & Authentication) |
| **Deployment** | Render (Backend), Vercel (Frontend), Docker |

---

## 🧠 Core Features

✅ **Dual Diagnosis Modes:** Choose between Coccidiosis (Fecal) and External Lesion (Skin/Foot) detection.  
✅ **Splash Cursor Effect:** Premium WebGL fluid simulation that follows the user's cursor.  
✅ **Dynamic Treatment Guides:** Real-time recovery and prevention steps tailored to the selected disease.  
✅ **High Accuracy Models:** Trained on curated poultry datasets with 98%+ accuracy for the external lesion module.  
✅ **Prediction History:** Securely save and view past diagnosis results using Firebase.  

---

## 🗂️ Project Structure
```
ChickTech-AI-Diagnosis/
│
├── frontend/                # Next.js app (UI)
│   ├── app/                 # Routes and Layouts
│   ├── components/          # React Components
│   │   ├── reactbits/       # Premium UI components (SplashCursor, etc.)
│   │   └── ui/              # Base UI components
│   └── public/              # Static assets
│
├── backend/                 # Flask Backend
│   ├── models/              # Trained .h5 models and metrics
│   ├── app.py               # API Entry Point
│   ├── predict.py           # Generic Predictor Class
│   └── train_external_lesion.py # Training script for new model
│
├── datasets/                # Training data (ignored)
├── requirements.txt         # Python dependencies
├── Dockerfile               # Container setup
└── README.md                # You are here
```

---

## ⚙️ Setup Instructions

### 🧩 Step 1 — Clone the Repository
```bash
git clone https://github.com/KunalBishwal/ChickTech-AI-Diagnosis.git
cd ChickTech-AI-Diagnosis
```

### 🐍 Backend Setup (Flask)
```bash
# Recommended: Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt
python backend/app.py
```

### ⚛️ Frontend Setup (Next.js)
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Security & Environment
- **`.env` Handling:** All API keys and environment variables are managed via `.env` files (ignored in Git).
- **Git LFS:** Used for tracking large model files (`.h5`).
- **Data Protection:** `minor_project.txt` and other sensitive notes are excluded via `.gitignore`.

---

## 🧑‍🏫 Author

**Kunal Bishwal**  
📍 *AI Developer | Full-Stack Engineer*  

💼 [LinkedIn](https://www.linkedin.com/in/kunalbishwal) • [GitHub](https://github.com/KunalBishwal)
