# AI Interview Backend – API Reference for Frontend

Complete reference for integrating the frontend with `ai-backend-fastapi`.

---

## Base URL & Auth

- **Base URL:** `http://localhost:8000` (or your deployed URL)
- **Auth:** JWT Bearer token for all protected routes (except `/auth/register`, `/auth/login`).
- **Header:** `Authorization: Bearer <access_token>`

---

## 1. Auth (`/auth`)

### POST `/auth/register`
Register a new user.

**Request body (JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ..."
}
```

**Errors:** `400` – Email already registered.

---

### POST `/auth/login`
Login and get token.

**Request body (JSON):**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ..."
}
```

**Errors:** `400` – Invalid credentials.

---

### GET `/auth/me` 🔒
Get current user. Requires `Authorization: Bearer <token>`.

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "candidate"
}
```

**Errors:** `401` – Invalid or expired token.

---

## 2. Interview Lifecycle (`/interviews`)

Flow: **Create** → **Setup AI** → **Start** → **Next question / Answer / Upload video** → **End** → **Report**.

---

### POST `/interviews/create` 🔒
Create a new interview (resume + job description).

**Request:** `multipart/form-data`
- `resume`: **File** (PDF or DOCX)
- `job_description`: **string** (form field)

**Response (200):**
```json
{
  "interview_id": "507f1f77bcf86cd799439011",
  "status": "created"
}
```

**Errors:** `500` – Failed to create interview.

**Frontend:** Store `interview_id` for all subsequent steps.

---

### POST `/interviews/{interview_id}/setup-ai` 🔒
Generate questions from resume + JD. Call after create.

**Response (200):**
```json
{
  "message": "AI setup completed",
  "questions_count": 5
}
```

**Errors:**
- `404` – Interview not found
- `400` – AI setup already completed
- `500` – AI setup failed

---

### POST `/interviews/{interview_id}/start` 🔒
Start the interview. Pass voice for TTS.

**Query params:**
- `voice`: `"male"` | `"female"`

**Response (200):**
```json
{
  "message": "Interview started",
  "voice": "female"
}
```

**Errors:**
- `400` – Invalid voice, or interview not ready to start
- `404` – Interview not found

---

### GET `/interviews/{interview_id}/next-question` 🔒
Get the next question for the current index.

**Response (200) – more questions:**
```json
{
  "question_number": 1,
  "question_text": "Tell me about your experience with Python.",
  "voice": "female"
}
```

**Response (200) – interview completed (no more questions):**
```json
{
  "message": "Interview completed"
}
```

**Errors:** `404` Interview not found, `400` Interview not in progress.

**⚠️ Frontend note:** Backend does **not** return `question_id` here. You need `question_id` for upload-video/analyze/score. See “Backend gap” section below for a suggested backend change.

---

### POST `/interviews/{interview_id}/answer-complete` 🔒
Mark current answer done and move to next question (increment index).

**Response (200):**
```json
{
  "message": "Answer recorded, moving to next question"
}
```

**Errors:** `400` – Unable to advance (e.g. not in progress).

---

### POST `/interviews/{interview_id}/end` 🔒
End interview early (status → completed).

**Response (200):**
```json
{
  "message": "Interview ended successfully"
}
```

**Errors:** `400` – Not in progress or already ended.

---

## 3. Video & Analysis (`/interviews`)

### POST `/interviews/{interview_id}/questions/{question_id}/upload-video` 🔒
Upload video answer for a question. Processing (transcribe, emotion, scoring) runs in background.

**Request:** `multipart/form-data`
- `video`: **File** (video file)

**Response (200):**
```json
{
  "message": "Video uploaded successfully. Processing started."
}
```

**Errors:** `404` – Interview or question not found.

**Frontend:** You need `question_id` (MongoDB ObjectId string). Currently `GET next-question` does not return it; see “Backend gap” below.

---

### POST `/interviews/{interview_id}/questions/{question_id}/analyze` 🔒
*Optional.* Run analysis on demand (audio + transcript + emotion). Usually not needed if you use upload-video (pipeline runs in background).

**Response (200):**
```json
{
  "message": "Analysis completed",
  "transcript": "...",
  "emotion": "happy",
  "confidence": "high"
}
```

---

### POST `/interviews/{interview_id}/questions/{question_id}/score` 🔒
*Optional.* Score a single answer on demand. Again, upload-video pipeline already scores; use this only if you need to re-score or didn’t use the pipeline.

**Response (200):**
```json
{
  "message": "Scoring completed",
  "score": {
    "accuracy": 85,
    "communication": 80,
    "behavior": 75
  }
}
```

**Errors:** `400` – Answer not ready for scoring (e.g. no transcript).

---

## 4. TTS (`/tts`)

### POST `/tts/generate` 🔒
Generate speech from text (e.g. for playing interviewer questions).

**Request body (JSON):**
```json
{
  "text": "Tell me about your experience with Python.",
  "voice": "female"
}
```

`voice`: `"male"` | `"female"`

**Response (200):**
```json
{
  "audio_path": "uploads/tts/ce280385-a42c-4f48-8cc8-6de6cfe82cc7.mp3"
}
```

**Frontend:** To play audio you need a URL. Backend does not expose a static file route in the code you have; you’ll need either:
- A route like `GET /files/{path}` that serves `uploads/tts/...`, or
- Base URL + `/uploads/tts/...` if FastAPI static mount is added.

---

## 5. Report (`/interviews`)

### GET `/interviews/{interview_id}/report` 🔒
Get final interview report (after interview is completed and answers are processed).

**Response (200):**
```json
{
  "decision": "HIRE",
  "scores": {
    "technical": 82.5,
    "communication": 78.0,
    "behavior": 75.0
  },
  "strengths": ["..."],
  "gaps": ["..."],
  "questions": [
    {
      "question_id": "...",
      "accuracy": 85,
      "communication": 80,
      "behavior": 75,
      "feedback": "Good technical depth."
    }
  ],
  "summary": "Strong technical foundation with good communication."
}
```

**Response (200) – incomplete (e.g. no answers):**
```json
{
  "status": "incomplete",
  "message": "Interview answers not found"
}
```

**Errors:** `404` – Interview not found.

---

## 6. Interview Session Status Flow

| Status               | Meaning                                      |
|----------------------|----------------------------------------------|
| `created`            | Interview created, AI not run yet            |
| `questions_generated`| AI run, ready to start                      |
| `in_progress`        | Interview started, questions in progress    |
| `completed`          | Interview finished                           |

---

## 7. Data Models (for reference)

- **User:** `id`, `name`, `email`, `role`
- **Session:** `user_id`, `status`, `resume`, `job_description`, `ai_context` (match_score, strengths, gaps), `interviewer.voice`, `current_question_index`
- **Question:** `session_id`, `order` (1–5), `question_text`; stored with `_id` (use as `question_id`)
- **Answer:** `session_id`, `question_id`, `video_path`, `transcript`, `emotion`, `confidence`, `score` (accuracy, communication, behavior), `feedback`, `status` (e.g. uploaded → completed / failed)

---

## 8. Backend Gap – `question_id` for Frontend

**Problem:**  
- `GET /interviews/{interview_id}/next-question` returns `question_number`, `question_text`, `voice` but **not** `question_id`.  
- Frontend needs `question_id` to call:
  - `POST .../questions/{question_id}/upload-video`
  - `POST .../questions/{question_id}/analyze`
  - `POST .../questions/{question_id}/score`

**Suggested backend change:**  
In `interview_execution.py`, in `get_next_question`, add `question_id` to the response when a question exists:

```python
return {
    "question_number": index + 1,
    "question_id": str(question["_id"]),  # add this
    "question_text": question["question_text"],
    "voice": session["interviewer"]["voice"]
}
```

After this, frontend can store `question_id` when it receives the next question and use it for upload-video and related APIs.

---

## 9. Suggested Frontend Flow

1. **Register/Login** → store `access_token` (e.g. in memory or secure storage).
2. **Create interview** → `POST /interviews/create` (resume + JD) → store `interview_id`.
3. **Setup AI** → `POST /interviews/{interview_id}/setup-ai`.
4. **Start** → `POST /interviews/{interview_id}/start?voice=female`.
5. **Loop:**
   - `GET /interviews/{interview_id}/next-question` → if `message === "Interview completed"` then go to step 6.
   - Show `question_text`, optionally play TTS via `POST /tts/generate` and play returned audio URL.
   - Record video answer, then `POST /interviews/{interview_id}/questions/{question_id}/upload-video` (need `question_id` from backend).
   - `POST /interviews/{interview_id}/answer-complete` → repeat loop.
6. **End** (or backend already set status to completed when no more questions).
7. **Report** → `GET /interviews/{interview_id}/report` (after processing; you may poll or wait a few seconds after last upload).

---

## 10. CORS & Static Files

- **CORS:** Backend allows `http://localhost:5173`, `http://localhost:3000`, and `127.0.0.1` variants so the React (Vite) frontend can call the API.
- **Static files:** `GET /uploads/...` serves files from the `uploads/` directory (e.g. TTS audio at `/uploads/tts/<id>.mp3`). Use `BASE_URL + "/" + audio_path` in the frontend to play TTS.

Backend uses `app.core.config.settings` from `.env`. Ensure:

- `JWT_SECRET`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- `DATABASE_URL` (MongoDB)
- `AZURE_OPENAI_*` for AI and scoring

---

This document reflects the current `ai-backend-fastapi` codebase. Use it to implement and test the frontend against the backend.
