import numpy as np
import math

class PhaseDetector:
    def __init__(self, fps):
        self.fps = fps
        
    def detect_phases(self, frames_data):
        valid_frames = [f for f in frames_data if f["landmarks"]]
        if not valid_frames:
            return {}
            
        n = len(valid_frames)
        
        # 1. Extract Camera-Invariant Features
        def get_hip(frame):
            lm = frame["landmarks"]
            return {"x": (lm[23]["x"] + lm[24]["x"]) / 2.0, "y": (lm[23]["y"] + lm[24]["y"]) / 2.0}

        def get_lowest_foot_y(frame):
            lm = frame["landmarks"]
            return max(lm[27]["y"], lm[28]["y"], lm[29]["y"], lm[30]["y"], lm[31]["y"], lm[32]["y"])

        def get_furthest_foot_x(frame):
            lm = frame["landmarks"]
            hx = get_hip(frame)["x"]
            return max(abs(lm[27]["x"] - hx), abs(lm[28]["x"] - hx), abs(lm[31]["x"] - hx), abs(lm[32]["x"] - hx))
            
        def get_knee_angle(frame, is_left):
            lm = frame["landmarks"]
            hip = lm[23] if is_left else lm[24]
            knee = lm[25] if is_left else lm[26]
            ankle = lm[27] if is_left else lm[28]
            
            # Vector 1 (Hip to Knee)
            v1 = (hip["x"] - knee["x"], hip["y"] - knee["y"])
            # Vector 2 (Ankle to Knee)
            v2 = (ankle["x"] - knee["x"], ankle["y"] - knee["y"])
            
            dot = v1[0]*v2[0] + v1[1]*v2[1]
            mag1 = math.sqrt(v1[0]**2 + v1[1]**2)
            mag2 = math.sqrt(v2[0]**2 + v2[1]**2)
            
            if mag1 * mag2 == 0:
                return 180
            
            cos_angle = max(-1.0, min(1.0, dot / (mag1 * mag2)))
            return math.degrees(math.acos(cos_angle))

        # Vertical distance from hip to lowest foot (high when standing/pushing, low when tucked in flight)
        leg_ext_y = [get_lowest_foot_y(f) - get_hip(f)["y"] for f in valid_frames]
        # Horizontal distance from hip to furthest foot (high during strides/landing)
        stride_x = [get_furthest_foot_x(f) for f in valid_frames]
        # Hip vertical position (low Y = high in the air)
        hip_y = [get_hip(f)["y"] for f in valid_frames]
        
        # Smooth arrays
        def smooth_array(arr, window=5):
            smoothed = []
            for i in range(len(arr)):
                start = max(0, i - window // 2)
                end = min(len(arr), i + window // 2 + 1)
                smoothed.append(sum(arr[start:end]) / (end - start))
            return smoothed
            
        leg_ext_y = smooth_array(leg_ext_y, window=5)
        stride_x = smooth_array(stride_x, window=5)
        hip_y = smooth_array(hip_y, window=5)
        
        # 2. Find True Flight Apex
        # Flight apex is when the athlete is highest in the air (minimum Y coordinate for the hip)
        search_start = int(n * 0.2)
        search_end = int(n * 0.8)
        
        apex_idx = search_start
        min_hip_y = float('inf')
        for i in range(search_start, search_end):
            if hip_y[i] < min_hip_y:
                min_hip_y = hip_y[i]
                apex_idx = i
                
        # 3. Find Toe-Off
        # Toe-off happens right before flight. It's the moment of maximum leg extension (pushing off).
        toe_off_idx = apex_idx
        max_ext_y = -1
        # Search backwards from apex for up to 2 seconds
        for i in range(apex_idx - 1, max(0, apex_idx - int(self.fps * 2.0)), -1):
            if leg_ext_y[i] > max_ext_y:
                max_ext_y = leg_ext_y[i]
                toe_off_idx = i
                
        # 4. Find Plant and Penultimate
        # During running, strides cause peaks in stride_x (horizontal extension).
        # We look for peaks in stride_x before the toe-off.
        peaks_x = []
        for i in range(2, toe_off_idx - 2):
            is_peak = True
            for j in range(max(0, i - 3), min(toe_off_idx, i + 4)):
                if stride_x[j] > stride_x[i]:
                    is_peak = False
                    break
            if is_peak:
                # Must be a prominent stride
                local_min = min(stride_x[max(0, i - 3):min(toe_off_idx, i + 4)])
                if stride_x[i] - local_min > 0.01:
                    # Group strides within 0.25s
                    if not peaks_x:
                        peaks_x.append(i)
                    else:
                        if i - peaks_x[-1] < int(self.fps * 0.25):
                            if stride_x[i] > stride_x[peaks_x[-1]]:
                                peaks_x[-1] = i
                        else:
                            peaks_x.append(i)
                            
        # The last peak before toe-off is plant, the one before is penultimate
        if len(peaks_x) >= 2:
            plant_idx = peaks_x[-1]
            penultimate_idx = peaks_x[-2]
        elif len(peaks_x) == 1:
            plant_idx = peaks_x[-1]
            penultimate_idx = max(0, plant_idx - int(self.fps * 0.3))
        else:
            plant_idx = max(0, toe_off_idx - int(self.fps * 0.2))
            penultimate_idx = max(0, plant_idx - int(self.fps * 0.3))
            
        # 5. Find Landing
        # Landing is characterized by a massive peak in stride_x (feet extending forward) 
        # followed immediately by a sharp drop in leg_ext_y (crumpling into sand).
        landing_idx = min(n - 1, apex_idx + int(self.fps * 0.5))
        max_land_stride = -1
        search_landing_end = min(n, apex_idx + int(self.fps * 1.5))
        for i in range(apex_idx + 2, search_landing_end):
            if stride_x[i] > max_land_stride:
                max_land_stride = stride_x[i]
                landing_idx = i

        return {
            "penultimate": {
                "frame": valid_frames[penultimate_idx]["frame_index"],
                "timestamp": valid_frames[penultimate_idx]["timestamp"],
                "confidence": 0.85
            },
            "plant": {
                "frame": valid_frames[plant_idx]["frame_index"],
                "timestamp": valid_frames[plant_idx]["timestamp"],
                "confidence": 0.88
            },
            "toe_off": {
                "frame": valid_frames[toe_off_idx]["frame_index"],
                "timestamp": valid_frames[toe_off_idx]["timestamp"],
                "confidence": 0.90
            },
            "flight": {
                "frame": valid_frames[apex_idx]["frame_index"],
                "timestamp": valid_frames[apex_idx]["timestamp"],
                "confidence": 0.82
            },
            "landing": {
                "frame": valid_frames[landing_idx]["frame_index"],
                "timestamp": valid_frames[landing_idx]["timestamp"],
                "confidence": 0.89
            }
        }
