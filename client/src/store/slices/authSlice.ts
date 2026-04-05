import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { User } from "@/types/auth";
import { getMe, login, register, logout  } from "@/lib/auth";
import type { LoginRequest, RegisterRequest } from "@/types/auth";
import { redirect } from "next/navigation";

type AuthStatus = "idle" | "loading" | "succeeded" | "failed";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

// --- Thunks: async work lives here ---

export const bootstrapAuth = createAsyncThunk(
  "auth/bootstrapAuth",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getMe();
      return res.data;
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
        "Not authenticated";
      return rejectWithValue(msg);
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (payload: LoginRequest, { rejectWithValue }) => {
    try {
      await login(payload);
      const res = await getMe();
      return res.data;
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
        "Login failed";
      return rejectWithValue(msg);
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (payload: RegisterRequest, { rejectWithValue }) => {
    try {
      await register(payload);
      const res = await getMe();
      return res.data;
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
        "Registration failed";
      return rejectWithValue(msg);
    }
  }
);
export const logoutUser = createAsyncThunk(
    "auth/logoutUser",
    async (_, { rejectWithValue }) => {
        try {   
            await logout();
            return {message: "Logout successful"};
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "Logout failed";
            return rejectWithValue(msg);
        }
    }
);

// --- Slice: sync reducers + wiring thunks ---

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(bootstrapAuth.rejected, (state, action) => {
        state.status = "failed";
        state.user = null;
        state.error = (action.payload as string) ?? "Session check failed";
      })
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? "Login failed";
      })
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? "Registration failed";
      })
      .addCase(logoutUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = "succeeded";
        state.user = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? "Logout failed";
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;