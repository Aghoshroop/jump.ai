interface Landmark { x: number; y: number; z?: number; visibility?: number; }
export interface FrameData {
    frame_index: number;
    timestamp: number;
    landmarks: Landmark[] | null;
}

export function detectPhases(framesData: FrameData[], fps: number) {
    const validFrames = framesData.filter(f => f.landmarks && f.landmarks.length > 0);
    if (validFrames.length === 0) return {};
    
    const n = validFrames.length;
    
    const getHip = (f: FrameData) => {
        const lm = f.landmarks!;
        return { x: (lm[23].x + lm[24].x) / 2, y: (lm[23].y + lm[24].y) / 2 };
    };
    
    const getLowestFootY = (f: FrameData) => {
        const lm = f.landmarks!;
        return Math.max(lm[27].y, lm[28].y, lm[29].y, lm[30].y, lm[31].y, lm[32].y);
    };
    
    const getFurthestFootX = (f: FrameData) => {
        const lm = f.landmarks!;
        const hx = getHip(f).x;
        return Math.max(Math.abs(lm[27].x - hx), Math.abs(lm[28].x - hx), Math.abs(lm[31].x - hx), Math.abs(lm[32].x - hx));
    };
    
    const legExtYRaw = validFrames.map(f => getLowestFootY(f) - getHip(f).y);
    const strideXRaw = validFrames.map(f => getFurthestFootX(f));
    const hipYRaw = validFrames.map(f => getHip(f).y);
    
    const smoothArray = (arr: number[], windowSize = 5) => {
        const smoothed = [];
        for (let i = 0; i < arr.length; i++) {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(arr.length, i + Math.floor(windowSize / 2) + 1);
            let sum = 0;
            for (let j = start; j < end; j++) sum += arr[j];
            smoothed.push(sum / (end - start));
        }
        return smoothed;
    };
    
    const legExtY = smoothArray(legExtYRaw, 5);
    const strideX = smoothArray(strideXRaw, 5);
    const hipY = smoothArray(hipYRaw, 5);
    
    const searchStart = Math.floor(n * 0.2);
    const searchEnd = Math.floor(n * 0.8);
    
    let apexIdx = searchStart;
    let minHipY = Infinity;
    for (let i = searchStart; i < searchEnd; i++) {
        if (hipY[i] < minHipY) {
            minHipY = hipY[i];
            apexIdx = i;
        }
    }
    
    let toeOffIdx = apexIdx;
    let maxExtY = -1;
    for (let i = apexIdx - 1; i >= Math.max(0, apexIdx - Math.floor(fps * 2.0)); i--) {
        if (legExtY[i] > maxExtY) {
            maxExtY = legExtY[i];
            toeOffIdx = i;
        }
    }
    
    const peaksX: number[] = [];
    for (let i = 2; i < toeOffIdx - 2; i++) {
        let isPeak = true;
        for (let j = Math.max(0, i - 3); j < Math.min(toeOffIdx, i + 4); j++) {
            if (strideX[j] > strideX[i]) {
                isPeak = false;
                break;
            }
        }
        if (isPeak) {
            let localMin = Math.min(...strideX.slice(Math.max(0, i - 3), Math.min(toeOffIdx, i + 4)));
            if (strideX[i] - localMin > 0.01) {
                if (peaksX.length === 0) {
                    peaksX.push(i);
                } else {
                    if (i - peaksX[peaksX.length - 1] < Math.floor(fps * 0.25)) {
                        if (strideX[i] > strideX[peaksX[peaksX.length - 1]]) {
                            peaksX[peaksX.length - 1] = i;
                        }
                    } else {
                        peaksX.push(i);
                    }
                }
            }
        }
    }
    
    let plantIdx, penultimateIdx;
    if (peaksX.length >= 2) {
        plantIdx = peaksX[peaksX.length - 1];
        penultimateIdx = peaksX[peaksX.length - 2];
    } else if (peaksX.length === 1) {
        plantIdx = peaksX[0];
        penultimateIdx = Math.max(0, plantIdx - Math.floor(fps * 0.3));
    } else {
        plantIdx = Math.max(0, toeOffIdx - Math.floor(fps * 0.2));
        penultimateIdx = Math.max(0, plantIdx - Math.floor(fps * 0.3));
    }
    
    let landingIdx = Math.min(n - 1, apexIdx + Math.floor(fps * 0.5));
    let maxLandStride = -1;
    let searchLandingEnd = Math.min(n, apexIdx + Math.floor(fps * 1.5));
    for (let i = apexIdx + 2; i < searchLandingEnd; i++) {
        if (strideX[i] > maxLandStride) {
            maxLandStride = strideX[i];
            landingIdx = i;
        }
    }
    
    return {
        penultimate: { frame: validFrames[penultimateIdx].frame_index, timestamp: validFrames[penultimateIdx].timestamp, confidence: 0.85 },
        plant: { frame: validFrames[plantIdx].frame_index, timestamp: validFrames[plantIdx].timestamp, confidence: 0.88 },
        toe_off: { frame: validFrames[toeOffIdx].frame_index, timestamp: validFrames[toeOffIdx].timestamp, confidence: 0.90 },
        flight: { frame: validFrames[apexIdx].frame_index, timestamp: validFrames[apexIdx].timestamp, confidence: 0.82 },
        landing: { frame: validFrames[landingIdx].frame_index, timestamp: validFrames[landingIdx].timestamp, confidence: 0.89 }
    };
}

function calculateAngle(a: Landmark, b: Landmark, c: Landmark) {
    let ang = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    ang = ang * (180 / Math.PI);
    return ang < 0 ? ang + 360 : ang;
}

function getJointAngle(landmarks: Landmark[], idxA: number, idxB: number, idxC: number) {
    const a = landmarks[idxA];
    const b = landmarks[idxB];
    const c = landmarks[idxC];
    let angle = calculateAngle(a, b, c);
    if (angle > 180) angle = 360 - angle;
    return parseFloat(angle.toFixed(1));
}

export function calculateBiomechanics(framesData: FrameData[], phases: any) {
    const metrics: any = {};
    for (const phaseName in phases) {
        const frameIdx = phases[phaseName].frame;
        const frame = framesData.find(f => f.frame_index === frameIdx);
        
        if (frame && frame.landmarks) {
            const lms = frame.landmarks;
            const leftKnee = getJointAngle(lms, 23, 25, 27);
            const rightKnee = getJointAngle(lms, 24, 26, 28);
            
            let plantKnee, driveKnee;
            if (lms[27].y > lms[28].y) {
                plantKnee = leftKnee;
                driveKnee = rightKnee;
            } else {
                plantKnee = rightKnee;
                driveKnee = leftKnee;
            }
            
            const lShoulder = lms[11], lHip = lms[23];
            const rShoulder = lms[12], rHip = lms[24];
            const midShoulder = { x: (lShoulder.x + rShoulder.x)/2, y: (lShoulder.y + rShoulder.y)/2 };
            const midHip = { x: (lHip.x + rHip.x)/2, y: (lHip.y + rHip.y)/2 };
            const vertical = { x: midHip.x, y: midHip.y - 0.1 };
            
            let torsoAngle = calculateAngle(midShoulder, midHip, vertical);
            if (torsoAngle > 180) torsoAngle = 360 - torsoAngle;
            
            metrics[phaseName] = {
                plant_knee_angle: plantKnee,
                drive_knee_angle: driveKnee,
                torso_angle: parseFloat(torsoAngle.toFixed(1))
            };
        } else {
            metrics[phaseName] = {};
        }
    }
    return metrics;
}

export function scoreJump(metrics: any) {
    const scores: any = {};
    let total = 0;
    
    for (const phase in metrics) {
        let score = 70;
        const m = metrics[phase];
        if (m.plant_knee_angle !== undefined) {
            const plantKnee = m.plant_knee_angle;
            const torso = m.torso_angle;
            
            if (phase === "penultimate") {
                score = 100 - Math.abs(torso - 10) * 0.5;
            } else if (phase === "plant") {
                if (plantKnee >= 135 && plantKnee <= 155) {
                    score = 100 - Math.abs(plantKnee - 145);
                } else {
                    score = Math.max(50, 90 - Math.abs(plantKnee - 145));
                }
            } else if (phase === "toe_off") {
                score = 100 - Math.abs(plantKnee - 170);
            } else if (phase === "flight") {
                score = 100 - Math.abs(torso - 5);
            } else if (phase === "landing") {
                score = Math.max(60, Math.min(100, torso * 2));
            }
        }
        
        score = Math.max(0, Math.min(100, Math.floor(score)));
        scores[phase] = score;
        total += score;
    }
    
    const overall = total / Math.max(1, Object.keys(scores).length);
    
    return {
        overall_score: Math.floor(overall),
        phase_scores: scores
    };
}

export function generateCoaching(scoreData: any, metrics: any) {
    const phaseScores = scoreData.phase_scores || {};
    if (Object.keys(phaseScores).length === 0) return null;
    
    let worstPhase = Object.keys(phaseScores)[0];
    for (const phase in phaseScores) {
        if (phaseScores[phase] < phaseScores[worstPhase]) {
            worstPhase = phase;
        }
    }
    
    const m = metrics[worstPhase] || {};
    
    if (worstPhase === "plant") {
        const knee = m.plant_knee_angle || 0;
        if (knee < 135) {
            return {
                top_fix: "Stiffen your plant leg to avoid collapsing.",
                why: `Your plant knee angle was ${knee}°, meaning you absorbed your speed instead of converting it to vertical lift.`,
                drill: "Short approach pop-ups focusing on a stiff, quick ground contact."
            };
        } else {
            return {
                top_fix: "Plant leg is too straight, reducing power.",
                why: `Your plant knee was ${knee}°, which acts as a brake. You need slight bend to generate force.`,
                drill: "Box drop jumps to learn proper energy absorption and redirection."
            };
        }
    } else if (worstPhase === "toe_off") {
        return {
            top_fix: "Extend fully through the board on takeoff.",
            why: "Your takeoff leg did not fully extend, meaning you left power on the runway.",
            drill: "Bounding drills focusing on full triple extension (hip, knee, ankle)."
        };
    } else if (worstPhase === "penultimate") {
        return {
            top_fix: "Maintain your speed and lower your hips.",
            why: "Your penultimate stride mechanics were off, which ruins the setup for the jump.",
            drill: "Run-throughs over mini-hurdles to groove the final two steps."
        };
    } else if (worstPhase === "landing") {
        return {
            top_fix: "Reach further forward before hitting the sand.",
            why: "You dropped your legs too early or sat back, losing valuable distance.",
            drill: "Standing long jumps into a pit, focusing exclusively on holding legs high."
        };
    } else {
        return {
            top_fix: "Hold your form in the air.",
            why: "Your flight posture rotated too early, killing your forward momentum.",
            drill: "Hang technique off a springboard to get comfortable with air time."
        };
    }
}
