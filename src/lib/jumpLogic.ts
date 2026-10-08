interface Landmark { x: number; y: number; z?: number; visibility?: number; }
export interface FrameData {
    frame_index: number;
    timestamp: number;
    landmarks: Landmark[] | null;
    image_url?: string;
}

export function detectPhases(framesData: FrameData[], fps: number) {
    const validFrames = framesData.filter(f => f.landmarks && f.landmarks.length > 0);
    if (validFrames.length === 0) return {};
    
    const n = validFrames.length;
    
    const getHip = (f: FrameData) => {
        const lm = f.landmarks!;
        return { x: (lm[23].x + lm[24].x) / 2, y: (lm[23].y + lm[24].y) / 2 };
    };
    
    const strideXRaw = validFrames.map(f => Math.abs(f.landmarks![27].x - f.landmarks![28].x));
    const hipYRaw = validFrames.map(f => getHip(f).y);
    
    const smoothArray = (arr: number[], windowSize = 7) => {
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
    
    const strideX = smoothArray(strideXRaw, 7);
    const hipY = smoothArray(hipYRaw, 7);
    
    // 1. Flight Apex (Highest point in air -> Minimum hip Y)
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
    
    // 2. Toe Off (Last local maximum of Stride X before apex - feet furthest apart)
    let toeOffIdx = apexIdx;
    for (let i = apexIdx - 1; i >= Math.floor(n * 0.05); i--) {
        if (strideX[i] > strideX[i-1] && strideX[i] > strideX[i+1]) {
            toeOffIdx = i;
            break;
        }
    }
    if (toeOffIdx === apexIdx) toeOffIdx = Math.max(0, apexIdx - Math.floor(fps * 0.15));

    // 3. Plant (Last local minimum of Stride X before toe off - ankles crossing during mid-stance)
    let plantIdx = toeOffIdx;
    for (let i = toeOffIdx - 2; i >= Math.floor(n * 0.02); i--) {
        if (strideX[i] < strideX[i-1] && strideX[i] < strideX[i+1]) {
            plantIdx = i;
            break;
        }
    }
    if (plantIdx === toeOffIdx) plantIdx = Math.max(0, toeOffIdx - Math.floor(fps * 0.1));

    // 4. Penultimate (Last local minimum of Stride X before Plant - previous step's mid-stance)
    let penultimateIdx = plantIdx;
    for (let i = plantIdx - 2; i >= 1; i--) {
        if (strideX[i] < strideX[i-1] && strideX[i] < strideX[i+1]) {
            penultimateIdx = i;
            break;
        }
    }
    if (penultimateIdx === plantIdx) penultimateIdx = Math.max(0, plantIdx - Math.floor(fps * 0.25));
    
    // 5. Landing (First local maximum of hip Y after apex, indicating dropping into the sand)
    let landingIdx = apexIdx;
    for (let i = apexIdx + 2; i < n - 1; i++) {
        if (hipY[i] > hipY[i-1] && hipY[i] > hipY[i+1]) {
            landingIdx = i;
            break;
        }
    }
    if (landingIdx === apexIdx) {
        let maxHY = -1;
        for (let i = apexIdx; i < n; i++) {
            if (hipY[i] > maxHY) { maxHY = hipY[i]; landingIdx = i; }
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
    
    // Physics Engine: Hang Time & Estimated Distance
    if (phases.toe_off && phases.landing && phases.toe_off.timestamp !== undefined && phases.landing.timestamp !== undefined) {
        let hangTime = phases.landing.timestamp - phases.toe_off.timestamp;
        if (hangTime < 0 || hangTime > 2) hangTime = 0.6; // fallback for bad data
        
        // H = (g * t^2) / 8
        const heightMeters = (9.81 * hangTime * hangTime) / 8;
        const heightInches = heightMeters * 39.37;
        
        // Long jumpers carry massive horizontal velocity (8-10 m/s).
        // Distance is roughly proportional to hangTime squared in athletic populations.
        // A 0.6s hang time typically yields around a 19 foot jump for competitive athletes.
        const distFeet = (hangTime * hangTime) * 52.8;
        
        metrics.physics = {
            hangTime: parseFloat(hangTime.toFixed(3)),
            maxHeightInches: parseFloat(heightInches.toFixed(1)),
            estDistanceFeet: parseFloat(distFeet.toFixed(1))
        };
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

export function generateCoaching(metrics: any) {
    if (!metrics || Object.keys(metrics).length === 0) return null;
    
    const weaknesses: any[] = [];
    const strengths: any[] = [];

    if (metrics.penultimate && metrics.penultimate.torso_angle !== undefined) {
        const penTorso = metrics.penultimate.torso_angle;
        if (penTorso > 25) {
            weaknesses.push({
                deficit: Math.abs(penTorso - 10),
                top_fix: "Raise your chest on the penultimate step.",
                why: `Your torso leaned forward at ${penTorso}°. This shifts your center of mass too far forward, killing vertical lift.`,
                drill: "Run-throughs with a medicine ball held at chest height to enforce upright posture."
            });
        } else if (penTorso < 15) {
            strengths.push({
                score: 100 - Math.abs(penTorso - 10),
                title: "Elite Penultimate Posture",
                why: `Your torso was perfectly upright at ${penTorso}°. This primed your center of mass for maximum vertical explosion.`
            });
        }
    }

    if (metrics.plant && metrics.plant.plant_knee_angle !== undefined) {
        const plantKnee = metrics.plant.plant_knee_angle;
        if (plantKnee < 135) {
            weaknesses.push({
                deficit: Math.abs(plantKnee - 145),
                top_fix: "Stiffen your plant leg on the board.",
                why: `Your knee collapsed to ${plantKnee}°. You absorbed your sprint speed instead of converting it into a vertical explosion.`,
                drill: "Short approach pop-ups focusing on a stiff, quick ground contact."
            });
        } else if (plantKnee > 165) {
            weaknesses.push({
                deficit: Math.abs(plantKnee - 145),
                top_fix: "Allow a slight bend in your plant leg.",
                why: `Your knee was locked straight at ${plantKnee}°, causing a heavy braking force that killed your speed.`,
                drill: "Box drop jumps to learn proper energy absorption and redirection."
            });
        } else if (plantKnee >= 135 && plantKnee <= 155) {
            strengths.push({
                score: 100 - Math.abs(plantKnee - 145),
                title: "Perfect Board Plant",
                why: `Your plant knee held strong at ${plantKnee}°. You beautifully converted your horizontal velocity into vertical lift without collapsing.`
            });
        }
    }

    if (metrics.toe_off && metrics.toe_off.plant_knee_angle !== undefined) {
        const toeOffKnee = metrics.toe_off.plant_knee_angle;
        if (toeOffKnee < 160) {
            weaknesses.push({
                deficit: Math.abs(toeOffKnee - 175),
                top_fix: "Fully extend your jumping leg at takeoff.",
                why: `Your takeoff leg only reached ${toeOffKnee}° of extension. You left the ground too early and lost massive power.`,
                drill: "Bounding drills focusing on pushing completely through the ankle and knee."
            });
        } else if (toeOffKnee > 168) {
            strengths.push({
                score: 100 - Math.abs(toeOffKnee - 180),
                title: "Explosive Takeoff Extension",
                why: `Full triple-extension achieved! Your jumping leg extended to ${toeOffKnee}°, maximizing your power output into the ground.`
            });
        }
        
        const driveKnee = metrics.toe_off.drive_knee_angle || 0;
        if (driveKnee > 130) {
            weaknesses.push({
                deficit: Math.abs(driveKnee - 90),
                top_fix: "Punch your free knee harder at takeoff.",
                why: `Your swing leg hung straight at ${driveKnee}° instead of driving up to lift your body into the air.`,
                drill: "High-knee bounding and step-ups onto a plyo box."
            });
        } else if (driveKnee < 100) {
            strengths.push({
                score: 100 - Math.abs(driveKnee - 90),
                title: "Aggressive Knee Drive",
                why: `Your free knee drove aggressively to ${driveKnee}°, generating massive upward momentum for your flight phase.`
            });
        }
    }

    if (metrics.flight && metrics.flight.torso_angle !== undefined) {
        const flightTorso = metrics.flight.torso_angle;
        if (flightTorso > 30) {
            weaknesses.push({
                deficit: Math.abs(flightTorso - 0),
                top_fix: "Hold your chest up while in the air.",
                why: `You rotated forward to a ${flightTorso}° torso angle too early, causing premature leg drop.`,
                drill: "Hang technique drills off a springboard to get comfortable with air time."
            });
        } else if (flightTorso < 15) {
            strengths.push({
                score: 100 - flightTorso,
                title: "Stable Flight Mechanics",
                why: `You maintained a strong, upright torso at ${flightTorso}° in the air, preventing forward rotation and maximizing your hang time.`
            });
        }
    }

    if (metrics.landing && metrics.landing.torso_angle !== undefined) {
        const landTorso = metrics.landing.torso_angle;
        if (landTorso < 25) {
            weaknesses.push({
                deficit: Math.abs(landTorso - 50),
                top_fix: "Reach forward and bring your chest over your knees on landing.",
                why: `Your torso was upright at ${landTorso}° upon landing, causing you to sit back and lose distance in the sand.`,
                drill: "Standing long jumps focusing exclusively on sweeping arms back and throwing legs high."
            });
        } else if (landTorso > 40) {
            strengths.push({
                score: 100 - Math.abs(landTorso - 50),
                title: "Deep Landing Compression",
                why: `You compressed your torso forward to ${landTorso}° perfectly, ensuring your mass carried past your heels to steal extra distance.`
            });
        }
    }

    weaknesses.sort((a, b) => b.deficit - a.deficit);
    strengths.sort((a, b) => b.score - a.score);

    let worstIssue = weaknesses.length > 0 ? weaknesses[0] : {
        top_fix: "Great jump mechanics overall!",
        why: "Your joint angles and torso posture are within the optimal elite ranges across all phases.",
        drill: "Continue focusing on approach speed and converting horizontal velocity."
    };
    
    let bestTrait = strengths.length > 0 ? strengths[0] : {
        title: "Solid Fundamental Base",
        why: "You executed the core phases safely. Focus on the critical fixes to unlock elite power and distance."
    };

    return {
        worstIssue,
        bestTrait
    };
}

export function generatePhaseSpecificCoaching(phase: string, metrics: any) {
    if (!metrics) return null;
    
    let good = '';
    let improvement = '';
    let drill = '';
    
    if (phase === 'penultimate') {
        const torso = metrics.torso_angle || 0;
        if (torso <= 15) {
            good = `"Elite posture." You kept your torso nicely upright at ${torso}°, which primes your body for max vertical lift.`;
            improvement = `Maintain this form. If you want more power, ensure your penultimate stride is your longest.`;
            drill = `Med-ball run-throughs to continue enforcing perfect posture.`;
        } else {
            good = `You entered the penultimate step with good speed.`;
            improvement = `"Raise your chest." You leaned forward to ${torso}°, shifting center of mass too far forward.`;
            drill = `Run-throughs with a medicine ball held at chest height to enforce upright posture.`;
        }
    } else if (phase === 'plant') {
        const knee = metrics.plant_knee_angle || 0;
        if (knee >= 135 && knee <= 165) {
            good = `"Perfect Board Plant." Your plant knee held strong at ${knee}°.`;
            improvement = `You successfully converted horizontal velocity into vertical lift. Focus on snapping the free leg up faster.`;
            drill = `Continuous pop-ups off a short approach to maintain this reflex.`;
        } else if (knee < 135) {
            good = `You attacked the board aggressively.`;
            improvement = `"Stiffen your plant leg." Your knee collapsed to ${knee}°. You absorbed speed instead of popping up.`;
            drill = `Short approach pop-ups focusing on a stiff, quick ground contact.`;
        } else {
            good = `You planted with extremely stiff leverage.`;
            improvement = `"Allow a slight bend." Your knee was locked straight at ${knee}°, causing a braking force.`;
            drill = `Box drop jumps to learn proper energy absorption and redirection.`;
        }
    } else if (phase === 'toe_off') {
        const knee = metrics.plant_knee_angle || 0;
        if (knee >= 165) {
            good = `"Explosive Takeoff." Full extension achieved at ${knee}°!`;
            improvement = `You maximized power output. To squeeze out more distance, ensure your arm swing is completely synced.`;
            drill = `Continue doing resisted bounding to maintain this extreme power output.`;
        } else {
            good = `You achieved decent liftoff speed.`;
            improvement = `"Fully extend your jumping leg." You only reached ${knee}° extension, leaving the ground too early.`;
            drill = `Bounding drills focusing on pushing completely through the ankle and knee.`;
        }
    } else if (phase === 'flight') {
        const torso = metrics.torso_angle || 0;
        if (torso <= 25) {
            good = `"Stable Mechanics." You maintained a strong, upright torso at ${torso}° in the air.`;
            improvement = `Your hang time is maximized. Focus on bringing the legs up higher during the final descent.`;
            drill = `Hang technique drills off a springboard to perfect arm cycling.`;
        } else {
            good = `You successfully cleared the board phase.`;
            improvement = `"Hold your chest up." You rotated forward to a ${torso}° torso angle too early, causing premature leg drop.`;
            drill = `Hang technique drills off a springboard to get comfortable with air time.`;
        }
    } else if (phase === 'landing') {
        const torso = metrics.torso_angle || 0;
        if (torso >= 35) {
            good = `"Deep Landing Compression." You compressed forward to ${torso}° perfectly.`;
            improvement = `Your mass carried past your heels. Work on shooting the feet out an extra inch just before contact.`;
            drill = `Sand pit landing drills from a standing jump to drill leg extension.`;
        } else {
            good = `You landed safely with both feet.`;
            improvement = `"Reach forward." Your torso was too upright at ${torso}°, causing you to sit back and lose distance.`;
            drill = `Standing long jumps focusing exclusively on sweeping arms back and throwing legs high.`;
        }
    }
    
    return { good, improvement, drill };
}
