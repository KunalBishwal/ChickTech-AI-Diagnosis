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

yaml
Copy code

---

## ⚙️ Setup Instructions

### 🧩 Step 1 — Clone the Repository
```bash
git clone https://github.com/KunalBishwal/ChickTech-AI-Diagnosis.git
cd ChickTech-AI-Diagnosis
🐍 Step 2 — Backend Setup (Flask + ML)
Create & activate virtual environment:

bash
Copy code
conda create -n cnncls python=3.8 -y
conda activate cnncls
Install dependencies:

bash
Copy code
pip install -r requirements.txt
Run Flask backend:

bash
Copy code
python app.py
Then visit:

cpp
Copy code
http://127.0.0.1:5000/
💻 Step 3 — Frontend Setup (Next.js)
Navigate to frontend folder:

bash
Copy code
cd frontend
npm install
npm run dev
Then open:

arduino
Copy code
http://localhost:3000
🧰 Step 4 — DVC Commands (for ML Pipelines)
bash
Copy code
dvc init
dvc repro
dvc dag
These manage your model training, tracking, and reproducibility.

☁️ Deployment Options
🔹 AWS Deployment (with GitHub Actions)
1. Create IAM User with:
AmazonEC2FullAccess

AmazonEC2ContainerRegistryFullAccess

2. Setup GitHub Secrets
ini
Copy code
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_ECR_LOGIN_URI=566373416292.dkr.ecr.us-east-1.amazonaws.com
ECR_REPOSITORY_NAME=chicktech
3. Build & Push Docker Image
bash
Copy code
docker build -t chickenapp .
docker tag chickenapp:latest <ECR_URI>/chicken:latest
docker push <ECR_URI>/chicken:latest
🔹 Azure Deployment (Alternative)
bash
Copy code
docker build -t chickenapp.azurecr.io/chicken:latest .
docker login chickenapp.azurecr.io
docker push chickenapp.azurecr.io/chicken:latest
Then deploy via Azure App Service → Container Settings.

🧑‍💻 Developer Workflow
Edit YAML configs → config.yaml, params.yaml

Update entities → /src/entity/

Modify components → /src/components/

Update pipelines → /src/pipeline/

Test with → python main.py

Track model changes → dvc repro

🔐 Security & Best Practices
Environment variables stored in .env.local and ignored in .gitignore

Sensitive keys (Google API, Azure Registry) are not committed

Git LFS handles large files like .h5, .keras, and .mp4

DVC ensures reproducibility for ML pipelines

🧾 Recommended .gitignore
gitignore
Copy code
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
🧪 Example API Usage
bash
Copy code
POST /predict
Content-Type: multipart/form-data
Body: { "image": "<chicken_image.jpg>" }
Response:

json
Copy code
{
  "prediction": "Coccidiosis Detected",
  "confidence": "97.43%"
}
🧱 CI/CD Workflow (Simplified)
yaml
Copy code
# .github/workflows/deploy.yml

name: Deploy to AWS
on:
  push:
    branches: [ "main" ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v3

      - name: Login to Amazon ECR
        run: |
          aws ecr get-login-password --region ${{ secrets.AWS_REGION }} | \
          docker login --username AWS --password-stdin ${{ secrets.AWS_ECR_LOGIN_URI }}

      - name: Build Docker image
        run: docker build -t chicktech .

      - name: Push Docker image
        run: |
          docker tag chicktech:latest ${{ secrets.AWS_ECR_LOGIN_URI }}/${{ secrets.ECR_REPOSITORY_NAME }}:latest
          docker push ${{ secrets.AWS_ECR_LOGIN_URI }}/${{ secrets.ECR_REPOSITORY_NAME }}:latest
🌐 Live Deployment (Optional)
Once deployed, access via:

cpp
Copy code
https://<your-aws-or-azure-url>/
💬 Contributing
Pull requests are welcome!
Please open an issue first to discuss changes or feature requests.

📜 License
This project is licensed under the MIT License.
Feel free to use and modify it with proper attribution.

🧑‍🏫 Author
Kunal Bishwal
📍 AI Developer | Full-Stack Engineer
💼 LinkedIn • GitHub
