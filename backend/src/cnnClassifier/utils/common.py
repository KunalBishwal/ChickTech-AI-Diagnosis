import os
import yaml
import json
import joblib
import base64
from pathlib import Path
from typing import Any
from box import ConfigBox
from box.exceptions import BoxValueError
from cnnClassifier import logger


def read_yaml(path_to_yaml: Path) -> ConfigBox:
    try:
        with open(path_to_yaml) as yaml_file:
            content = yaml.safe_load(yaml_file)
            logger.info(f"YAML file loaded successfully: {path_to_yaml}")
            return ConfigBox(content)
    except BoxValueError:
        raise ValueError("YAML file is empty")
    except Exception as e:
        raise e


def create_directories(path_to_directories: list, verbose: bool = True):
    for path in path_to_directories:
        os.makedirs(path, exist_ok=True)
        if verbose:
            logger.info(f"Created directory: {path}")


def save_json(path: Path, data: dict):
    with open(path, "w") as f:
        json.dump(data, f, indent=4)
    logger.info(f"JSON file saved at: {path}")


def load_json(path: Path) -> ConfigBox:
    with open(path) as f:
        content = json.load(f)
    logger.info(f"JSON file loaded successfully: {path}")
    return ConfigBox(content)


def save_bin(data: Any, path: Path):
    joblib.dump(value=data, filename=path)
    logger.info(f"Binary file saved at: {path}")


def load_bin(path: Path) -> Any:
    data = joblib.load(path)
    logger.info(f"Binary file loaded from: {path}")
    return data


def get_size(path: Path) -> str:
    size_in_kb = round(os.path.getsize(path) / 1024)
    return f"~ {size_in_kb} KB"


def decodeImage(imgstring, fileName):
    imgdata = base64.b64decode(imgstring)
    with open(fileName, "wb") as f:
        f.write(imgdata)


def encodeImageIntoBase64(croppedImagePath):
    with open(croppedImagePath, "rb") as f:
        return base64.b64encode(f.read())
