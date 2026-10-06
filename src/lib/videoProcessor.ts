import { detectPhases, calculateBiomechanics, scoreJump, generateCoaching, type FrameData } from './jumpLogic';

const Pose = (window as any).Pose;

export async function processVideoFile(file: File | Blob, onProgress: (progress: number, message: string) => void): Promise<any> {
    return new Promise((resolve, reject) => {
        onProgress(0, 'Initializing AI engine...');
        
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.crossOrigin = "anonymous";
        video.playsInline = true;
        video.preload = "auto";
        
        const framesData: FrameData[] = [];
        let frameIndex = 0;
        
        video.onloadeddata = async () => {
            onProgress(10, 'Loading MediaPipe model...');
            
            const pose = new Pose({
                locateFile: (file: any) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
            });
            
            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            pose.onResults((results: any) => {
                framesData.push({
                    frame_index: frameIndex,
                    timestamp: video.currentTime,
                    landmarks: results.poseLandmarks || null
                });
                frameIndex++;
                
                const percent = Math.floor((video.currentTime / video.duration) * 100);
                onProgress(10 + Math.floor(percent * 0.7), `Tracking anatomy (${percent}%)...`);
            });

            await pose.initialize();

            let currentTime = 0;
            const duration = video.duration;
            const step = 1 / 30; // 30 FPS

            const processNextFrame = () => {
                if (currentTime >= duration) {
                    finishAnalysis();
                    return;
                }
                video.currentTime = currentTime;
            };

            video.onseeked = async () => {
                try {
                    await pose.send({ image: video });
                    currentTime += step;
                    processNextFrame();
                } catch (e) {
                    console.error("Pose processing error:", e);
                    currentTime += step;
                    processNextFrame();
                }
            };

            processNextFrame();
        };
        
        const finishAnalysis = async () => {
            onProgress(85, 'Analyzing jump mechanics...');
            
            try {
                // Wait a tiny bit for the last pose result
                await new Promise(r => setTimeout(r, 500));
                
                const fps = framesData.length / video.duration;
                
                const phases = detectPhases(framesData, fps);
                const metrics = calculateBiomechanics(framesData, phases);
                const scoreData = scoreJump(metrics);
                const coaching = generateCoaching(scoreData, metrics);
                
                onProgress(95, 'Extracting phase imagery...');
                
                // Extract images for phases
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                
                for (const phase in phases) {
                    const phaseData = (phases as any)[phase];
                    if (phaseData && phaseData.timestamp !== undefined) {
                        video.currentTime = phaseData.timestamp;
                        await new Promise(r => {
                            video.onseeked = () => {
                                if (ctx) {
                                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                    phaseData.image_url = canvas.toDataURL('image/jpeg', 0.7);
                                }
                                r(null);
                            };
                        });
                    }
                }
                
                resolve({
                    phases,
                    metrics,
                    overall_score: scoreData.overall_score,
                    phase_scores: scoreData.phase_scores,
                    coaching,
                    original_video_url: video.src // pass to analysis view
                });
            } catch (err) {
                console.error(err);
                reject(err);
            }
        };
        
        video.onerror = (e) => reject(e);
    });
}
