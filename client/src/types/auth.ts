export enum Role {
  candidate = "candidate",
  recruiter = "recruiter",
}
export interface BaseRegister{
    name: string
    email: string
    password: string
}
export interface CandidateRegister extends BaseRegister{
    role: Role.candidate
}
export interface RecruiterRegister extends BaseRegister{
    role: Role.recruiter
    recruiter_info: {
        company_name: string
        website_url: string
    }
}

export type RegisterRequest = CandidateRegister | RecruiterRegister

export interface LoginRequest {
  email: string
  password: string
}
export interface User {
  id: string
  name: string
  email: string
  role: Role
}
export interface ApiResponse<T> {
  message: string
  data: T
}
export interface LoginResponse {
  access_token: string
  message: string
}

export interface RecruiterInfo {
  company_name: string
  website_url: string
}
export interface RegisterResponse {
  access_token: string
  message: string
}