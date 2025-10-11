document.addEventListener('DOMContentLoaded', () => {
    // --- PARTICLE BACKGROUND ---
    tsParticles.load("particles-js", { /* unchanged config */ });

    // --- 3D TILT EFFECT (applied to all cards) ---
    VanillaTilt.init(document.querySelectorAll(".card"), {
        max: 15, speed: 400, glare: true, "max-glare": 0.5, scale: 1.02
    });

    // --- APP LOGIC ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const imagePreview = document.getElementById('image-preview');
    const predictButton = document.getElementById('predict-button');
    const resultSection = document.getElementById('result-section');
    const predictionText = document.getElementById('prediction-text');
    const spinner = document.getElementById('spinner');
    const dropZoneText = document.getElementById('drop-zone-text');
    const infoButton = document.getElementById('info-button');
    const confidenceScore = document.getElementById('confidence-score'); // Get the new element

    let base64Image = "";

    // Event Listeners (unchanged)
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
    predictButton.addEventListener('click', predict);

    // handleFile function (unchanged)
    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                dropZoneText.style.display = 'none';
                predictButton.style.display = 'block';
                resultSection.style.display = 'none';
                base64Image = e.target.result.replace(/^data:image.+;base64,/, '');
            };
            reader.readAsDataURL(file);
        } else {
            alert("Please upload a valid image file.");
            base64Image = "";
        }
    }

    // predict function (unchanged)
    async function predict() {
        if (!base64Image) { alert("Please upload an image first."); return; }
        spinner.style.display = 'block';
        resultSection.style.display = 'none';
        predictButton.style.display = 'none';
        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image }),
            });
            if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
            const data = await response.json();
            displayResult(data);
        } catch (error) {
            console.error('Prediction failed:', error);
            displayResult(null, true);
        } finally {
            spinner.style.display = 'none';
            predictButton.style.display = 'block';
        }
    }

    // displayResult function (UPDATED)
    function displayResult(data, isError = false) {
        infoButton.style.display = 'none';
        confidenceScore.style.display = 'none';

        if (isError) {
            predictionText.textContent = "An error occurred during prediction.";
            predictionText.className = "error";
        } else if (data && data.length > 0 && data[0].class) {
            const prediction = data[0].class;
            const score = data[0].score;
            
            predictionText.textContent = prediction;
            confidenceScore.textContent = `Confidence: ${(score * 100).toFixed(1)}%`;
            confidenceScore.style.display = 'block';

            predictionText.className = prediction.toLowerCase() === 'healthy' ? 'healthy' : 'coccidiosis';
            infoButton.style.display = prediction.toLowerCase() === 'coccidiosis' ? 'inline-block' : 'none';
        } else {
            predictionText.textContent = "Could not determine the result.";
            predictionText.className = "";
        }
        resultSection.style.display = 'block';
    }
});