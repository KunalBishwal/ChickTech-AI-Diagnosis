# 🐔 ChickTech — AI-Powered Chicken Disease Diagnosis

> An end-to-end **Machine Learning + Web Application** that detects chicken diseases from images using AI.  
> Built with **Flask**, **Next.js**, and **Deep Learning**, and deployable via **AWS** or **Azure** CI/CD pipelines.

---

## 🚀 Tech Stack

| Layer | Technologies Used |
|-------|--------------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, GSAP Animations |
| **Backend / API** | Flask (Python), REST API |
| **Machine Learning** | TensorFlow / Keras, OpenCV, DVC Pipelines |
| **Database / Storage** | AWS S3, Azure Container Registry |
| **CI/CD** | GitHub Actions, Docker, AWS EC2 / Azure Web App |
| **Version Control** | Git, Git LFS (for large models) |

---

## 🧠 Core Features

✅ AI-based chicken disease classification from image uploads  
✅ Confidence-level visualization with smooth animations  
✅ Cure & prevention recommendation system  
✅ Multi-lingual interface (English + Hindi)  
✅ Secure `.env` and `.gitignore` handling  
✅ Integrated with Git LFS for large ML models  
✅ AWS & Azure ready deployment pipelines  

---

## 🗂️ Project Structure
```
Chicken-Disease-Classification-Projects/
│
├── frontend/ # Next.js app (UI)
│ ├── app/
│ ├── components/
│ ├── public/
│ ├── package.json
│
├── src/ # Core ML & pipeline source
│ ├── components/
│ ├── config/
│ ├── entity/
│ ├── pipeline/
│ └── utils/
│
├── artifacts/ # Model artifacts (.h5, .keras)
├── static/ # Static assets
├── templates/ # Flask templates
├── config/ # YAML configuration files
├── logs/ # Training & runtime logs
│
├── app.py # Flask app entry point
├── main.py # ML pipeline entry
├── requirements.txt # Python dependencies
├── Dockerfile # Container setup
├── dvc.yaml # DVC workflow definition
└── README.md # You are here
```


---

## ⚙️ Setup Instructions

### 🧩 Step 1 — Clone the Repository
```bash
git clone https://github.com/KunalBishwal/ChickTech-AI-Diagnosis.git
cd ChickTech-AI-Diagnosis
```
### Backend Setup (Flask + ML)
```bash
conda create -n cnncls python=3.8 -y
conda activate cnncls
pip install -r requirements.txt
python app.py
http://127.0.0.1:5000/
```

### Frontend Setup (Next.js)
```bash
Navigate to frontend folder:

cd frontend
npm install
npm run dev

Then open:
http://localhost:3000
```
### DVC Commands (for ML Pipelines)
```
dvc init
dvc repro
dvc dag
```

### 🧑‍💻 Developer Workflow
```bash
Edit YAML configs → config.yaml, params.yaml

Update entities → /src/entity/

Modify components → /src/components/

Update pipelines → /src/pipeline/

Test with → python main.py

Track model changes → dvc repro
```

### 🔐 Security & Best Practices
```bash
Environment variables stored in .env.local and ignored in .gitignore

Sensitive keys (Google API, Azure Registry) are not committed

Git LFS handles large files like .h5, .keras, and .mp4

DVC ensures reproducibility for ML pipelines
```

### Recommended .gitignore
```bash
# Environment files
.env
.env.local
.env.production
.env.development

# Python
__pycache__/
*.pyc
venv/
logs/

# Node / Next.js
node_modules/
.next/

# ML artifacts
artifacts/
*.h5
*.keras
*.mp4
research/
static/

# OS / misc
.DS_Store
*.log
```
