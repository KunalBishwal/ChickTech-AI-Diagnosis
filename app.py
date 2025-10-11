# from flask import Flask, request, jsonify, render_template
# import os
# from flask_cors import CORS, cross_origin
# from cnnClassifier.utils.common import decodeImage
# from cnnClassifier.pipeline.predict import PredictionPipeline

# os.putenv('LANG', 'en_US.UTF-8')
# os.putenv('LC_ALL', 'en_US.UTF-8')

# app = Flask(__name__)
# CORS(app)

# class ClientApp:
#     def __init__(self):
#         self.filename = "inputImage.jpg"
#         self.classifier = PredictionPipeline(self.filename)

# @app.route("/", methods=['GET'])
# @cross_origin()
# def home():
#     return render_template('index.html')

# @app.route("/coccidiosis", methods=['GET'])
# @cross_origin()
# def coccidiosis_info():
#     return render_template('coccidiosis.html')


# @app.route("/train", methods=['GET','POST'])
# @cross_origin()
# def trainRoute():
#     os.system("dvc repro") # Using dvc repro is better
#     return "Training done successfully!"


# @app.route("/predict", methods=['POST'])
# @cross_origin()
# def predictRoute():
#     image = request.json['image']
#     decodeImage(image, clApp.filename)
#     result = clApp.classifier.predict()
#     return jsonify(result)

# # Instantiate the ClientApp object here, only once
# clApp = ClientApp()

# if __name__ == "__main__":
#     # The clApp object is already created, so we just run the app
#     app.run(host='0.0.0.0', port=8080)
    
    
    


################################### REACT APP ###########################################
from flask import Flask, request, jsonify
import os
from flask_cors import CORS, cross_origin
from cnnClassifier.utils.common import decodeImage
from cnnClassifier.pipeline.predict import PredictionPipeline

os.putenv('LANG', 'en_US.UTF-8')
os.putenv('LC_ALL', 'en_US.UTF-8')

app = Flask(__name__)
CORS(app)

class ClientApp:
    def __init__(self):
        self.filename = "inputImage.jpg"
        self.classifier = PredictionPipeline(self.filename)

# Instantiate the ClientApp object once
clApp = ClientApp()

@app.route("/train", methods=['GET','POST'])
@cross_origin()
def trainRoute():
    """
    This endpoint triggers the DVC pipeline to retrain the model.
    """
    os.system("dvc repro --force")
    return jsonify({"message": "Training done successfully!"})


@app.route("/predict", methods=['POST'])
@cross_origin()
def predictRoute():
    """
    This endpoint receives an image and returns a prediction.
    """
    image = request.json['image']
    decodeImage(image, clApp.filename)
    result = clApp.classifier.predict()
    return jsonify(result)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)