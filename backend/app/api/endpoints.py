from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, List
import uuid
import os
import shutil
from app.analysis.analysis_pipeline import JumpAnalyzer

router = APIRouter()

jobs: Dict[str, Dict[str, Any]] = {}
results: Dict[str, Dict[str, Any]] = {}

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class AnalyzeResponse(BaseModel):
    job_id: str
    status: str

@router.post("/jumps/video", response_model=AnalyzeResponse)
async def upload_and_analyze(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    if not file_extension:
        file_extension = ".mp4"
    saved_filename = f"{job_id}_video{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    jobs[job_id] = {"status": "QUEUED", "progress": 0}
    
    background_tasks.add_task(process_video_task, job_id, file_path)
    
    return {"job_id": job_id, "status": "QUEUED"}

def process_video_task(job_id: str, file_path: str):
    jobs[job_id]["status"] = "PROCESSING"
    jobs[job_id]["progress"] = 10
    
    try:
        analyzer = JumpAnalyzer(file_path, job_id, jobs)
        result = analyzer.run_pipeline()
        
        results[job_id] = result
        jobs[job_id]["status"] = "COMPLETED"
        jobs[job_id]["progress"] = 100
    except Exception as e:
        import traceback
        with open("error_log.txt", "w") as f:
            f.write(traceback.format_exc())
        jobs[job_id]["status"] = "FAILED"
        jobs[job_id]["error"] = str(e)

@router.get("/jumps/{job_id}/status")
def get_job_status(job_id: str):
    if job_id not in jobs:
        return {"status": "NOT_FOUND"}
    return jobs[job_id]

@router.get("/jumps/{job_id}/result")
def get_job_result(job_id: str):
    if job_id not in results:
        return {"status": "NOT_READY"}
    return results[job_id]
