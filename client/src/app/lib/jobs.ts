import api from "./api";
import type { JobCreateRequest, CreateJobResponse, JobsListResponse, Job } from "../types/jobs";

export const createJob = async (payload: JobCreateRequest): Promise<CreateJobResponse> => {
  const response = await api.post<CreateJobResponse>("/recruiter/create-job", payload);
  return response.data;
};

export const getJobs = async (): Promise<JobsListResponse> => {
  const response = await api.get<JobsListResponse>("/recruiter/get-jobs");
  return response.data;
};

export interface GetJobResponse {
  message: string;
  data: Job;
}

export const getJobById = async (jobId: string): Promise<GetJobResponse> => {
  const response = await api.get<GetJobResponse>(`/recruiter/get-job/${jobId}`);
  return response.data;
};


