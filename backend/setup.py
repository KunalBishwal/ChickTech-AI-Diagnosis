from setuptools import setup, find_packages

setup(
    name="cnnClassifier",
    version="0.0.1",
    author="KunalBishwal",
    author_email="kunalbishwal2004@gmail.com",
    description="A CNN-based chicken disease diagnosis backend for ChickTech AI.",
    long_description="Flask-based backend service for ChickTech AI — enabling chicken disease prediction using deep learning models.",
    long_description_content_type="text/markdown",
    url="https://github.com/KunalBishwal/ChickTech-AI-Diagnosis",
    project_urls={
        "Bug Tracker": "https://github.com/KunalBishwal/ChickTech-AI-Diagnosis/issues",
    },
    package_dir={"": "src"},
    packages=find_packages(where="src"),
)
