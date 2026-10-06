import math

class Biomechanics:
    def calculate_angle(self, a, b, c):
        ang = math.degrees(math.atan2(c['y']-b['y'], c['x']-b['x']) - math.atan2(a['y']-b['y'], a['x']-b['x']))
        return ang + 360 if ang < 0 else ang

    def get_joint_angle(self, landmarks, idx_a, idx_b, idx_c):
        a = landmarks[idx_a]
        b = landmarks[idx_b]
        c = landmarks[idx_c]
        angle = self.calculate_angle(a, b, c)
        if angle > 180:
            angle = 360 - angle
        return round(angle, 1)

    def calculate_phase_metrics(self, frames_data, phases):
        metrics = {}
        for phase_name, phase_info in phases.items():
            frame_idx = phase_info["frame"]
            frame = next((f for f in frames_data if f["frame_index"] == frame_idx), None)
            
            if frame and frame["landmarks"]:
                lms = frame["landmarks"]
                
                left_knee = self.get_joint_angle(lms, 23, 25, 27)
                right_knee = self.get_joint_angle(lms, 24, 26, 28)
                
                # Plant leg is the foot closest to the ground (max y)
                if lms[27]['y'] > lms[28]['y']:
                    plant_knee = left_knee
                    drive_knee = right_knee
                else:
                    plant_knee = right_knee
                    drive_knee = left_knee
                
                # Torso angle using midpoints of shoulders and hips
                l_shoulder, l_hip = lms[11], lms[23]
                r_shoulder, r_hip = lms[12], lms[24]
                mid_shoulder = {'x': (l_shoulder['x'] + r_shoulder['x'])/2, 'y': (l_shoulder['y'] + r_shoulder['y'])/2}
                mid_hip = {'x': (l_hip['x'] + r_hip['x'])/2, 'y': (l_hip['y'] + r_hip['y'])/2}
                vertical = {'x': mid_hip['x'], 'y': mid_hip['y'] - 0.1}
                
                torso_angle = self.calculate_angle(mid_shoulder, mid_hip, vertical)
                if torso_angle > 180: torso_angle = 360 - torso_angle
                
                metrics[phase_name] = {
                    "plant_knee_angle": plant_knee,
                    "drive_knee_angle": drive_knee,
                    "torso_angle": round(torso_angle, 1)
                }
            else:
                metrics[phase_name] = {}
                
        return metrics
