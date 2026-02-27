import { User, ApiResponse, LoginResponse, LoginRequest, RegisterResponse, RegisterRequest } from "../types/auth"
import api from "./api"


export const getMe = async (): Promise<ApiResponse<User>> => {
  const response = await api.get<ApiResponse<User>>("/auth/me")
  return response.data 
}

export const login = async (loginRequest: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", loginRequest)
  return response.data 
}
export const register = async (registerRequest: RegisterRequest): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>("/auth/register", registerRequest)
  return response.data 
}