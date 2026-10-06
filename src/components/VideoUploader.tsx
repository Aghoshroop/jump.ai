import React, { useState, useRef, type DragEvent } from 'react';
import type * as mpCam from '@mediapipe/camera_utils';
import { processVideoFile } from '../lib/videoProcessor';

const Pose = (window as any).Pose;
const POSE_CONNECTIONS = (window as any).POSE_CONNECTIONS;
const Camera = (window as any).Camera;
const drawConnectors = (window as any).drawConnectors;
const drawLandmarks = (window as any).drawLandmarks;

interface Props {
  onUploadSuccess: (result: any) => void;
}

const VideoUploader: React.FC<Props> = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Recording State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [jumpDetected, setJumpDetected] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const timeout30sRef = useRef<number | null>(null);
  const cameraRef = useRef<mpCam.Camera | null>(null);
  
  const hipHistory = useRef<{time: number, y: number}[]>([]);
  const hasJumped = useRef(false);

  const handleFile = async (file: File | Blob) => {
    if (!file) return;
    stopCamera();

    setIsUploading(true);
    setUploadProgress(0);
    setUploadMessage('Initializing local AI...');

    try {
      const actualFile = file instanceof File ? file : new File([file], 'live_recording.webm', { type: 'video/webm' });
      const result = await processVideoFile(actualFile, (progress, msg) => {
        setUploadProgress(progress);
        setUploadMessage(msg);
      });
      onUploadSuccess(result);
    } catch (err) {
      console.error(err);
      alert('Analysis failed. Check console for details.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragActive(true);
  };
  const handleDragLeave = () => setIsDragActive(false);
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  // --- LIVE MEDIA PIPE LOGIC ---
  const startCamera = async () => {
    setIsCameraActive(true);
    setWarningMsg('');
    setJumpDetected(false);
    hasJumped.current = false;
    hipHistory.current = [];
    chunksRef.current = [];

    // Wait for DOM to render the video and canvas elements
    setTimeout(async () => {
        if (!liveVideoRef.current || !canvasRef.current) return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 60 } } 
            });
            liveVideoRef.current.srcObject = stream;
            
            // Start recording immediately
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
            };
            mediaRecorder.onstop = () => {
                if (hasJumped.current) {
                    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                    handleFile(blob);
                }
            };
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(100);

            // Set up MediaPipe
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
                if (!canvasRef.current || !liveVideoRef.current) return;
                const canvasCtx = canvasRef.current.getContext('2d');
                if (!canvasCtx) return;
                
                canvasRef.current.width = liveVideoRef.current.videoWidth;
                canvasRef.current.height = liveVideoRef.current.videoHeight;
                canvasCtx.save();
                canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                if (results.poseLandmarks) {
                    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
                    drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
                    
                    if (!hasJumped.current) {
                        const lHip = results.poseLandmarks[23];
                        const rHip = results.poseLandmarks[24];
                        const hipY = (lHip.y + rHip.y) / 2;
                        const now = Date.now();
                        
                        hipHistory.current.push({ time: now, y: hipY });
                        hipHistory.current = hipHistory.current.filter(h => now - h.time < 1000); // keep last 1s
                        
                        if (hipHistory.current.length > 5) {
                            const oldest = hipHistory.current[0];
                            // If hip dropped then rapidly went up (jumped), Y coordinate gets much smaller
                            if (oldest.y - hipY > 0.15) { // 15% screen height rapid rise
                                hasJumped.current = true;
                                setJumpDetected(true);
                                // Stop 2 seconds after jump
                                setTimeout(() => {
                                    stopCamera();
                                }, 2000);
                            }
                        }
                    }
                }
                canvasCtx.restore();
            });

            const camera = new Camera(liveVideoRef.current, {
                onFrame: async () => {
                    if (liveVideoRef.current) {
                        await pose.send({ image: liveVideoRef.current });
                    }
                },
                width: 1280,
                height: 720
            });
            camera.start();
            cameraRef.current = camera;

            // 30 Second strict timer
            setRecordingTime(30);
            timerRef.current = window.setInterval(() => {
                setRecordingTime((prev) => {
                    if (prev <= 1) return 0;
                    return prev - 1;
                });
            }, 1000);

            timeout30sRef.current = window.setTimeout(() => {
                if (!hasJumped.current) {
                    setWarningMsg('WARNING: No jump detected in 30 seconds! Auto-stopping.');
                    stopCamera();
                }
            }, 30000);

        } catch (err) {
            console.error(err);
            alert('Camera failed or MediaPipe blocked. Ensure permissions.');
            setIsCameraActive(false);
        }
    }, 100);
  };

  const stopCamera = () => {
    if (cameraRef.current) {
        cameraRef.current.stop();
    }
    if (liveVideoRef.current && liveVideoRef.current.srcObject) {
        const stream = liveVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
    }
    setIsCameraActive(false);
    clearInterval(timerRef.current as number);
    clearTimeout(timeout30sRef.current as number);
  };

  return (
    <div className="card text-center" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem' }}>
      <input type="file" accept="video/mp4,video/quicktime,video/webm" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
      
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem', fontSize: '2rem' }}>Analyze Your Jump</h3>
      <p className="mb-4" style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '80%', margin: '0 auto 2rem' }}>
        For best results, record from the side.
      </p>

      {warningMsg && (
          <div style={{ background: '#ff4444', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', fontWeight: 'bold' }}>
              {warningMsg}
          </div>
      )}

      {isCameraActive ? (
        <div style={{ marginBottom: '2rem', position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000', border: jumpDetected ? '4px solid #00FF00' : '4px solid transparent', transition: 'border 0.3s' }}>
          <video ref={liveVideoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }} />
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          
          <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.7)', padding: '10px 20px', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
             {recordingTime}s remaining
          </div>

          {jumpDetected && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0, 255, 0, 0.9)', color: 'black', padding: '1rem 3rem', borderRadius: '50px', fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', boxShadow: '0 0 30px #00FF00' }}>
                  JUMP DETECTED!
                  <div style={{ fontSize: '1rem', marginTop: '10px' }}>Stopping in 2 seconds...</div>
              </div>
          )}
          
          <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button className="primary-btn" onClick={() => { setWarningMsg(''); stopCamera(); }} style={{ background: '#333', borderRadius: '50px', padding: '0.8rem 2rem', border: '2px solid #ff4444' }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div 
              className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
              style={{ flex: 1 }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <h4 style={{ fontSize: '1.2rem', margin: '1rem 0 0.5rem' }}>Drag & Drop Video</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>or click to browse</p>
            </div>

            <div className="upload-zone" style={{ flex: 1, borderColor: 'var(--accent-gold)' }} onClick={() => !isUploading && startCamera()}>
              <div className="upload-icon" style={{ color: 'var(--accent-gold)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z"></path>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
              </div>
              <h4 style={{ fontSize: '1.2rem', margin: '1rem 0 0.5rem', color: 'var(--accent-gold)' }}>Auto-Capture Live</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time jump detection</p>
            </div>
        </div>
      )}

      {isUploading && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
          <p style={{ color: 'var(--accent-orange)', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem' }}>
            {uploadMessage}
          </p>
          <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-orange))', transition: 'width 0.2s ease-out' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
