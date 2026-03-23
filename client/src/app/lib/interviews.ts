import api from "./api";

export interface InterviewListItem {
  interview_id: string;
  status: string;
  report_status: "pending" | "completed" | string;
  label: string;
  started_at: string | null;
}

export interface InterviewsListResponse {
  interviews: InterviewListItem[];
}

export interface QuestionFeedback {
  question_id: string;
  accuracy: number;
  communication: number;
  behavior: number;
  feedback: string;
}

export interface InterviewScores {
  technical: number;
  communication: number;
  behavior: number;
}

export interface InterviewReport {
  status: "completed" | "processing" | "incomplete" | string;
  message?: string;
  decision?: string;
  scores?: InterviewScores;
  strengths?: string[];
  gaps?: string[];
  questions?: QuestionFeedback[];
  summary?: string;
}

export interface CreateInterviewResponse {
  interview_id: string;
  status: string;
}

export const listInterviews = async (): Promise<InterviewsListResponse> => {
  const response = await api.get<InterviewsListResponse>("/interviews");
  return response.data;
};

export const getInterviewReport = async (interviewId: string): Promise<InterviewReport> => {
  const response = await api.get<InterviewReport>(`/interviews/${interviewId}/report`);
  return response.data;
};

export const createInterview = async (
  formData: FormData,
): Promise<CreateInterviewResponse> => {
  const response = await api.post<CreateInterviewResponse>("/interviews/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const setupInterviewAI = async (
  interviewId: string,
): Promise<{ message: string; questions_count: number }> => {
  const response = await api.post<{ message: string; questions_count: number }>(
    `/interviews/${interviewId}/setup-ai`,
  );
  return response.data;
};

export type VoiceOption = "male" | "female";

export interface NextQuestionResponse {
  message?: string;
  question_number: number;
  question_id: string;
  question_text: string;
  voice: VoiceOption;
}

export const startInterview = async (
  interviewId: string,
  voice: VoiceOption,
): Promise<{ message: string; voice: VoiceOption }> => {
  const response = await api.post<{ message: string; voice: VoiceOption }>(
    `/interviews/${interviewId}/start`,
    null,
    { params: { voice } },
  );
  return response.data;
};

export const getNextQuestion = async (
  interviewId: string,
): Promise<NextQuestionResponse | { message: "Interview completed" }> => {
  const response = await api.get<NextQuestionResponse | { message: "Interview completed" }>(
    `/interviews/${interviewId}/next-question`,
  );
  return response.data;
};

export const uploadAnswerVideo = async (
  interviewId: string,
  questionId: string,
  videoBlob: Blob,
): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append("video", videoBlob, "answer.webm");
  const response = await api.post<{ message: string }>(
    `/interviews/${interviewId}/questions/${questionId}/upload-video`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
};

export const getAnswerStatus = async (
  interviewId: string,
  questionId: string,
): Promise<{
  status: string;
  has_transcript: boolean;
  has_score: boolean;
  has_feedback: boolean;
}> => {
  const response = await api.get<{
    status: string;
    has_transcript: boolean;
    has_score: boolean;
    has_feedback: boolean;
  }>(`/interviews/${interviewId}/questions/${questionId}/answer-status`);
  return response.data;
};

export const completeAnswer = async (interviewId: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`/interviews/${interviewId}/answer-complete`);
  return response.data;
};

export const skipQuestion = async (
  interviewId: string,
  questionId: string,
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    `/interviews/${interviewId}/questions/${questionId}/skip`,
  );
  return response.data;
};

export const endInterview = async (interviewId: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`/interviews/${interviewId}/end`);
  return response.data;
};

export const generateTTS = async (
  text: string,
  voice: VoiceOption,
): Promise<{ audio_url: string; public_id: string }> => {
  const response = await api.post<{ audio_url: string; public_id: string }>("/tts/generate", {
    text,
    voice,
  });
  return response.data;
};

