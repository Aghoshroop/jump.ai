class CoachingEngine:
    def generate_feedback(self, score_data, metrics):
        phase_scores = score_data.get("phase_scores", {})
        
        if not phase_scores:
            return None
            
        # Find the worst performing phase
        worst_phase = min(phase_scores, key=phase_scores.get)
        m = metrics.get(worst_phase, {})
        
        if worst_phase == "plant":
            knee = m.get("plant_knee_angle", 0)
            if knee < 135:
                return {
                    "top_fix": "Stiffen your plant leg to avoid collapsing.",
                    "why": f"Your plant knee angle was {knee}°, meaning you absorbed your speed instead of converting it to vertical lift.",
                    "drill": "Short approach pop-ups focusing on a stiff, quick ground contact."
                }
            else:
                return {
                    "top_fix": "Plant leg is too straight, reducing power.",
                    "why": f"Your plant knee was {knee}°, which acts as a brake. You need slight bend to generate force.",
                    "drill": "Box drop jumps to learn proper energy absorption and redirection."
                }
        elif worst_phase == "toe_off":
            return {
                "top_fix": "Extend fully through the board on takeoff.",
                "why": "Your takeoff leg did not fully extend, meaning you left power on the runway.",
                "drill": "Bounding drills focusing on full triple extension (hip, knee, ankle)."
            }
        elif worst_phase == "penultimate":
            return {
                "top_fix": "Maintain your speed and lower your hips.",
                "why": "Your penultimate stride mechanics were off, which ruins the setup for the jump.",
                "drill": "Run-throughs over mini-hurdles to groove the final two steps."
            }
        elif worst_phase == "landing":
            return {
                "top_fix": "Reach further forward before hitting the sand.",
                "why": "You dropped your legs too early or sat back, losing valuable distance.",
                "drill": "Standing long jumps into a pit, focusing exclusively on holding legs high."
            }
        else: # flight
            return {
                "top_fix": "Hold your form in the air.",
                "why": "Your flight posture rotated too early, killing your forward momentum.",
                "drill": "Hang technique off a springboard to get comfortable with air time."
            }
