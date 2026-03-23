export type Mode = "remote" | "onsite" | "hybrid";

export interface JobBase {
  title: string;
  description: string;
  location: string;
  salary: number;
  experience: number;
  skills: string[];
  mode: Mode;
}

export interface Job extends JobBase {
  id: string;
}

export type JobCreateRequest = JobBase;

export interface CreateJobResponse {
  message: string;
  data: Job;
}

export interface JobsListResponse {
  message: string;
  data: Job[];
}

