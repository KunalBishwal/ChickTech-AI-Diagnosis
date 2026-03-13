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
| **Backend / API** | Flask (Python), Flask-Limiter, cachetools, pybloom_live |
| **Machine Learning** | MobileNetV2, OpenCV, Sentence-Transformers (RAG embeddings) |
| **Generative AI**| Google Gemini (GenAI), Sarvam AI (Translate, STT, TTS) |
| **Database / Auth** | Firebase (Firestore & Authentication) |
| **Deployment** | Render (Backend), Vercel (Frontend), Docker |

---

## 🧠 Core Features

✅ **Dual Diagnosis Modes:** Choose between Coccidiosis (Fecal) and External Lesion (Skin/Foot) detection.  
✅ **AI Treatment Plans (RAG):** Gemini-powered, context-aware recovery plans generated instantly by retrieving data from a comprehensive 47-chunk custom Knowledge Base across 9 diseases.
✅ **Backend Security Layer:** Enterprise-grade security using `flask-limiter` for rate limiting, `pybloom_live` Bloom filters for cache-miss attack prevention, and strict payload sanitization (magic bytes, MIME types).
✅ **Multilingual Translation (Sarvam AI):** Instantly translate the entire application into 10+ Indic languages with high-speed batching.  
✅ **Voice-to-Text Symptom Logger (Sarvam AI):** Speak symptoms naturally and let the AI automatically suggest the right diagnostic path.  
✅ **Text-to-Speech Accessibility (Sarvam AI):** Listen to diagnosis results and treatment steps completely in regional languages.  
✅ **Cinematic Glassmorphism UI:** Premium WebGL fluid simulation (Splash Cursor), custom-styled themed dropdowns, and GSAP animations.  
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
│   ├── app.py               # API Entry Point (with strict security)
│   ├── predict.py           # Generic Predictor Class
│   ├── rag_engine.py        # Gemini + SentenceTransformers RAG Pipeline
│   ├── knowledge_base.json  # Vector database seed chunks
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
