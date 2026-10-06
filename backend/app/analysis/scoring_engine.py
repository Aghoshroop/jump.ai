class ScoringEngine:
    def score_jump(self, metrics):
        scores = {}
        total = 0
        
        # Scoring logic based on ideal biomechanics for each phase
        for phase, m in metrics.items():
            score = 70 # Base score
            if "plant_knee_angle" in m:
                plant_knee = m["plant_knee_angle"]
                torso = m["torso_angle"]
                
                if phase == "penultimate":
                    # Hips should lower slightly, torso upright
                    score = 100 - abs(torso - 10) * 0.5
                elif phase == "plant":
                    # Plant knee should be relatively stiff (135-155 degrees)
                    if 135 <= plant_knee <= 155:
                        score = 100 - abs(plant_knee - 145)
                    else:
                        score = max(50, 90 - abs(plant_knee - 145))
                elif phase == "toe_off":
                    # Plant leg should be almost fully extended (160-180 degrees)
                    score = 100 - abs(plant_knee - 170)
                elif phase == "flight":
                    # Upright torso in air
                    score = 100 - abs(torso - 5)
                elif phase == "landing":
                    # Should lean forward (torso > 30 degrees)
                    score = max(60, min(100, torso * 2))
            
            # Bound score between 0 and 100
            score = max(0, min(100, int(score)))
            scores[phase] = score
            total += score
            
        overall = total / max(1, len(scores))
        
        return {
            "overall_score": int(overall),
            "phase_scores": scores
        }
