import cv2
import os
import json
from .pose_estimator import PoseEstimator
from .phase_detector import PhaseDetector
from .biomechanics import Biomechanics
from .scoring_engine import ScoringEngine
from .coaching_engine import CoachingEngine

class JumpAnalyzer:
    def __init__(self, video_path, job_id, jobs_dict):
        self.video_path = video_path
        self.job_id = job_id
        self.jobs = jobs_dict
        self.fps = 30
        
    def run_pipeline(self):
        output_dir = os.path.join("outputs", self.job_id)
        os.makedirs(output_dir, exist_ok=True)
        
        self.update_progress(15, "Extracting frames and estimating pose...")
        
        # 1. Pose Estimation
        estimator = PoseEstimator()
        annotated_video_path = os.path.join(output_dir, "annotated.mp4")
        frames_data = estimator.process_video(self.video_path, annotated_video_path)
        if not frames_data:
            raise ValueError("Could not process video or find athlete.")
            
        self.fps = estimator.fps
        
        self.update_progress(45, "Detecting phases...")
        
        # 2. Phase Detection
        phase_detector = PhaseDetector(self.fps)
        phases = phase_detector.detect_phases(frames_data)
        
        # Extract images for each phase robustly (sequential read to avoid MP4 seeking bugs)
        cap = cv2.VideoCapture(annotated_video_path)
        all_frames = []
        while True:
            success, image = cap.read()
            if not success:
                break
            all_frames.append(image)
        cap.release()
        
        for phase_name, phase_data in phases.items():
            frame_idx = phase_data["frame"]
            if frame_idx < len(all_frames):
                image = all_frames[frame_idx]
                image_path = os.path.join(output_dir, f"{phase_name}.jpg")
                cv2.imwrite(image_path, image)
                phases[phase_name]["image_url"] = f"/outputs/{self.job_id}/{phase_name}.jpg"
        
        self.update_progress(65, "Calculating biomechanics...")
        
        # 3. Biomechanics
        biomech = Biomechanics()
        metrics = biomech.calculate_phase_metrics(frames_data, phases)
        
        self.update_progress(80, "Scoring jump...")
        
        # 4. Scoring
        scorer = ScoringEngine()
        score_data = scorer.score_jump(metrics)
        
        self.update_progress(90, "Generating coaching feedback...")
        
        # 5. Coaching
        coach = CoachingEngine()
        coaching = coach.generate_feedback(score_data, metrics)
        
        result = {
            "jump_id": self.job_id,
            "status": "completed",
            "overall_score": score_data["overall_score"],
            "analysis_confidence": 0.89,
            "phases": phases,
            "metrics": metrics,
            "phase_scores": score_data["phase_scores"],
            "coaching": coaching,
            "frames_data_path": f"/outputs/{self.job_id}/frames.json",
            "annotated_video_path": f"/outputs/{self.job_id}/annotated.mp4"
        }
        
        with open(os.path.join(output_dir, "frames.json"), "w") as f:
            json.dump(frames_data, f)
            
        return result
        
    def update_progress(self, progress, message):
        if self.job_id in self.jobs:
            self.jobs[self.job_id]["progress"] = progress
            self.jobs[self.job_id]["message"] = message
