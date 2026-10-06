import ctypes

# ---------------------------------------------------------
# PATCH: Fix "function 'free' not found" bug in Windows
# ---------------------------------------------------------
# Pre-compile the dummy function OUTSIDE the hook to prevent internal ctypes recursion
dummy_free = ctypes.CFUNCTYPE(None, ctypes.c_void_p)(lambda x: None)

_original_getattr = ctypes.CDLL.__getattr__

def _patched_getattr(self, name):
    if name == 'free':
        return dummy_free
    return _original_getattr(self, name)

ctypes.CDLL.__getattr__ = _patched_getattr
# ---------------------------------------------------------

import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np

class PoseEstimator:
    def __init__(self):
        import os
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        model_path = os.path.join(base_dir, 'pose_landmarker.task')
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            min_pose_detection_confidence=0.6,
            min_pose_presence_confidence=0.6,
            min_tracking_confidence=0.6,
            output_segmentation_masks=False)
        self.detector = vision.PoseLandmarker.create_from_options(options)
        self.fps = 30
        
    def process_video(self, video_path, output_video_path=None, progress_callback=None):
        cap = cv2.VideoCapture(video_path)
        self.fps = cap.get(cv2.CAP_PROP_FPS) or 30
        
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            total_frames = 300 # fallback
        
        # Downscale to max 480p to prevent OOM on 512MB RAM servers
        max_dim = 480
        if max(width, height) > max_dim:
            scale = max_dim / max(width, height)
            width = int(width * scale)
            height = int(height * scale)
        
        actual_output_path = output_video_path
        out = None
        if output_video_path:
            fourcc = cv2.VideoWriter_fourcc(*'vp80')
            out = cv2.VideoWriter(output_video_path, fourcc, self.fps, (width, height))
            if not out.isOpened():
                actual_output_path = output_video_path.replace('.webm', '.mp4')
                fourcc = cv2.VideoWriter_fourcc(*'avc1')
                out = cv2.VideoWriter(actual_output_path, fourcc, self.fps, (width, height))

        frames_data = []
        frame_idx = 0

        # Define connections based on mediapipe pose
        POSE_CONNECTIONS = [
            (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8),
            (9, 10), (11, 12), (11, 13), (13, 15), (15, 17), (15, 19),
            (15, 21), (17, 19), (12, 14), (14, 16), (16, 18), (16, 20),
            (16, 22), (18, 20), (11, 23), (12, 24), (23, 24), (23, 25),
            (24, 26), (25, 27), (26, 28), (27, 29), (28, 30), (29, 31),
            (30, 32), (27, 31), (28, 32)
        ]

        while cap.isOpened():
            success, image = cap.read()
            if not success:
                break
                
            timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))
            if timestamp_ms < 0:
                timestamp_ms = int(frame_idx * 1000 / self.fps)

            # Resize image to match output video width/height
            image = cv2.resize(image, (width, height))

            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
            
            results = self.detector.detect_for_video(mp_image, timestamp_ms)
            
            if results.pose_landmarks and len(results.pose_landmarks) > 0:
                landmarks = []
                for lm in results.pose_landmarks[0]:
                    landmarks.append({
                        "x": lm.x,
                        "y": lm.y,
                        "z": lm.z,
                        "visibility": lm.visibility
                    })
                    
                frames_data.append({
                    "frame_index": frame_idx,
                    "timestamp": timestamp_ms / 1000.0,
                    "landmarks": landmarks,
                    "confidence": results.pose_landmarks[0][0].visibility
                })
                
                if out is not None:
                    # Draw connections
                    for start_idx, end_idx in POSE_CONNECTIONS:
                        start_lm = landmarks[start_idx]
                        end_lm = landmarks[end_idx]
                        if start_lm['visibility'] > 0.5 and end_lm['visibility'] > 0.5:
                            start_point = (int(start_lm['x'] * width), int(start_lm['y'] * height))
                            end_point = (int(end_lm['x'] * width), int(end_lm['y'] * height))
                            cv2.line(image, start_point, end_point, (72, 197, 247), 3)
                    
                    # Draw landmarks
                    for lm in landmarks:
                        if lm['visibility'] > 0.5:
                            point = (int(lm['x'] * width), int(lm['y'] * height))
                            cv2.circle(image, point, 4, (53, 107, 255), -1)
                            
            else:
                frames_data.append({
                    "frame_index": frame_idx,
                    "timestamp": timestamp_ms / 1000.0,
                    "landmarks": None,
                    "confidence": 0
                })
                
            if out is not None:
                out.write(image)
                
            frame_idx += 1
            if progress_callback and frame_idx % 10 == 0:
                progress_callback(min(frame_idx / total_frames, 0.99))
            
        cap.release()
        if out is not None:
            out.release()
            
        return self._smooth_landmarks(frames_data), actual_output_path

    def _smooth_landmarks(self, frames_data, alpha=0.5):
        smoothed = []
        prev_landmarks = None
        
        for frame in frames_data:
            if not frame["landmarks"]:
                smoothed.append(frame)
                continue
                
            if not prev_landmarks:
                prev_landmarks = frame["landmarks"]
                smoothed.append(frame)
                continue
                
            new_lms = []
            for i, lm in enumerate(frame["landmarks"]):
                prev_lm = prev_landmarks[i]
                new_lms.append({
                    "x": alpha * lm["x"] + (1 - alpha) * prev_lm["x"],
                    "y": alpha * lm["y"] + (1 - alpha) * prev_lm["y"],
                    "z": alpha * lm["z"] + (1 - alpha) * prev_lm["z"],
                    "visibility": lm["visibility"]
                })
                
            prev_landmarks = new_lms
            
            smoothed.append({
                "frame_index": frame["frame_index"],
                "timestamp": frame["timestamp"],
                "landmarks": new_lms,
                "confidence": frame["confidence"]
            })
            
        return smoothed
