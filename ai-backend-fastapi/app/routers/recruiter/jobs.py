from fastapi import APIRouter, HTTPException,Depends
from app.core.database import db
from app.models.create_jobs import CreateJobResponse, JobCreate, JobInDB, JobResponse
from app.core.security import get_current_user, required_role
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone


router = APIRouter(prefix="/recruiter", tags=["Recruiter"])

# ======================
# for making role based just add Depends(required_role("recruiter")) in the function
# for now simple i have added get_current_user and required_role in the function
# ======================

@router.post("/create-job",response_model=CreateJobResponse)
async def create_job(job: JobCreate,current_user: str = Depends(get_current_user)):
    
    print("[Backend 🎤] Recruiter: Create job endpoint hit – job create kar rahe hain!")
    try:
        print("[Backend 🎤] Recruiter: Job data receive –", job.dict())
        job_data = JobInDB(**job.dict(), recruiter_id=str(current_user["_id"]))

        result = await db.jobs.insert_one(job_data.dict())

        if not result.inserted_id:
            raise HTTPException(status_code=400, detail="Failed to create job")
        
        print("[Backend 🎤] Recruiter: Job created –", result)

        return CreateJobResponse(
            message="Job created successfully",
            data=JobResponse(
                id=str(result.inserted_id),
                title=job_data.title,
                description=job_data.description,
                location=job_data.location,
                salary=job_data.salary,
                experience=job_data.experience,
                skills=job_data.skills,
                mode=job_data.mode
            )
        )
    except Exception as e:
        print("[Backend 🎤] Recruiter: Error creating job –", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.put("/update-job/{job_id}")
async def update_job(job_id: str, job: JobCreate, current_user: str = Depends(get_current_user)):
    print("[Backend 🎤] Recruiter: Update job endpoint hit – updating job in DB")
    try:
        existing_job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        if not existing_job:
            raise HTTPException(status_code=404, detail="Job not found")

        if existing_job["recruiter_id"] != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not allowed")

        update_data = job.dict()
        update_data["updated_at"] = datetime.now(timezone.utc)
        result = await db.jobs.update_one({"_id": ObjectId(job_id)}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Job not found")
        return {"message": "Job updated successfully", "data": update_data}
    except Exception as e:
        print("[Backend 🎤] Recruiter: Error updating job –", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/get-jobs")
async def get_jobs( current_user: str = Depends(get_current_user)):
    print("[Backend 🎤] Recruiter: Get jobs endpoint hit – getting jobs from DB")
    try:
        jobs = await db.jobs.find({}).to_list(length=100)
        print("[Backend 🎤] Recruiter: Jobs fetched –", len(jobs))
        formatted_jobs = []

        for job in jobs:
            new_job = {
                "id": str(job["_id"]),
                "title": job["title"],
                "description": job["description"],
                "location": job["location"],
                "salary": job["salary"],
                "experience": job.get("experience", 0),
                "skills": job.get("skills", []),
                "mode": job["mode"],
            }
            formatted_jobs.append(new_job)

        return {"message": "Jobs fetched successfully", "data": formatted_jobs}
    except Exception as e:
        print("[Backend 🎤] Recruiter: Error fetching jobs –", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/get-job/{job_id}")
async def get_job(job_id: str, current_user: str = Depends(get_current_user)):

    print("[Backend 🎤] Recruiter: Get job endpoint hit – getting job from DB")
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job id")

        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        formatted_job = {
            "id": str(job["_id"]),
            "title": job["title"],
            "description": job["description"],
            "location": job["location"],
            "salary": job["salary"],
            "experience": job.get("experience", 0),
            "skills": job.get("skills", []),
            "mode": job["mode"],
        }
        return {"message": "Job fetched successfully", "data": formatted_job}
    except HTTPException:
        raise
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid job id")
    except Exception as e:
        print("[Backend 🎤] Recruiter: Error fetching job –", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")