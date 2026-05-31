import sys
import os
import base64
import json
import cv2
import numpy as np
import io
import re
from PIL import Image

# This script is designed to be called from Electron via spawn
# It uses YOLO for detection and EasyOCR for reading
# Optimized for Indonesian License Plates (B, L, D, etc.)

def main():
    try:
        # Load AI libraries
        from ultralytics import YOLO
        import easyocr

        # Path discovery for bundled resources
        # When bundled, files might be in a different relative path
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Priority 1: Specialized Indonesian Weights
        # Priority 2: Standard YOLOv10 Nano
        model_paths = [
            os.path.join(current_dir, "indonesian_lpr.pt"),
            os.path.join(current_dir, "yolov10n.pt"),
            "yolov10n.pt" # Fallback to auto-download if missing
        ]
        
        selected_model = None
        for path in model_paths:
            if os.path.exists(path) or path == "yolov10n.pt":
                selected_model = path
                break
        
        model = YOLO(selected_model) 
        reader = easyocr.Reader(['en']) # English letters are used in Indonesian plates

        # Read base64 image from stdin
        input_data = sys.stdin.read().strip()
        if not input_data:
            print(json.dumps({"error": "No input data received via stdin"}))
            return

        # Clean base64 header
        if "base64," in input_data:
            input_data = input_data.split("base64,")[1]
        
        # Decode and prepare image
        img_bytes = base64.b64decode(input_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            print(json.dumps({"error": "Failed to decode image"}))
            return

        # Detect Bounding Boxes
        results = model.predict(source=img, conf=0.3, verbose=False)
        
        # We'll collect all possible plate candidates
        candidates = []
        
        # Pattern for Indonesian Plates: 1-2 letters, 1-4 numbers, 1-3 letters
        # Example: B 1234 ABC, L 1234 XX, D 1 A
        plate_regex = re.compile(r'([A-Z]{1,2})(\d{1,4})([A-Z]{1,3})')

        # If YOLO found something, we crop and OCR
        found_by_yolo = False
        for r in results:
            for box in r.boxes:
                found_by_yolo = True
                # Get crop coordinates
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                # Add a small margin
                margin = 5
                crop = img[max(0, y1-margin):min(img.shape[0], y2+margin), 
                           max(0, x1-margin):min(img.shape[1], x2+margin)]
                
                # OCR the crop
                ocr_results = reader.readtext(crop)
                for (_, text, prob) in ocr_results:
                    clean = text.upper().replace(' ', '').replace('.', '').replace('-', '')
                    match = plate_regex.search(clean)
                    if match:
                        formatted = f"{match.group(1)} {match.group(2)} {match.group(3)}"
                        candidates.append({"plate": formatted, "score": prob, "method": "YOLO-Crop"})

        # Fallback: OCR the whole image/middle if YOLO missed
        if not candidates:
            ocr_results = reader.readtext(img)
            for (_, text, prob) in ocr_results:
                clean = text.upper().replace(' ', '').replace('.', '').replace('-', '')
                match = plate_regex.search(clean)
                if match:
                    formatted = f"{match.group(1)} {match.group(2)} {match.group(3)}"
                    candidates.append({"plate": formatted, "score": prob, "method": "Full-Scan"})

        if candidates:
            # Sort by confidence score
            candidates.sort(key=lambda x: x["score"], reverse=True)
            winner = candidates[0]
            result = {
                "success": True,
                "plate": winner["plate"],
                "score": round(float(winner["score"]), 3),
                "method": winner["method"],
                "model": os.path.basename(selected_model) if selected_model else "builtin"
            }
        else:
            result = {
                "success": False,
                "error": "No plate recognized in image.",
                "engine": "YOLOv10+EasyOCR"
            }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
