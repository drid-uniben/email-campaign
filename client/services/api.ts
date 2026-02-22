import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { getToken, saveTokens, saveUserData, clearAllData } from "./indexdb";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// --- Interfaces ---
export interface LoginResponse {
  success: boolean;
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface UserProfile {
  _id: string; // Add the _id property
  id: string;
  name: string;
  email: string;
  role: string;
  unit?: any;
  isApproved: boolean;
  rejectionReason?: string;
  createdAt: string;
}

export interface Unit {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface EmailRecipient {
  userId: string;
  name: string;
  email: string;
  role: string;
  unit?: string;
  isApproved: boolean;
}

export interface EmailRecipientsResponse {
  success: boolean;
  data: EmailRecipient[];
}

export interface EmailPreviewRequest {
  recipientIds: string[];
  subject: string;
  headerTitle: string;
  bodyContent: string;
  attachments?: File[];
}

export interface SendCampaignRequest extends EmailPreviewRequest {}

// Create API instance
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 15000,
});

// Request interceptor
api.interceptors.request.use(async (config) => {
  const token = await getToken("accessToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  loginAdmin: async (credentials: any): Promise<LoginResponse> => {
    const response = await api.post("/auth/admin-login", credentials);
    if (response.data.success) {
      await saveTokens(response.data.accessToken);
      await saveUserData(response.data.user);
    }
    return response.data;
  },
  logout: async () => {
    await api.post("/auth/logout");
    await clearAllData();
  },
  verifyToken: async () => {
    const response = await api.get("/auth/verify-token");
    return response.data;
  },
};

// Unit Management API
export const unitApi = {
  getAll: async () => {
    const response = await api.get("/admin/units");
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/admin/units/${id}`);
    return response.data;
  },
  create: async (data: { name: string; description?: string }) => {
    const response = await api.post("/admin/units", data);
    return response.data;
  },
  update: async (id: string, data: { name?: string; description?: string }) => {
    const response = await api.patch(`/admin/units/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/admin/units/${id}`);
    return response.data;
  },
};

// User Management API
export const userApi = {
  getUsers: async (params: any) => {
    const response = await api.get("/admin/users", { params });
    return response.data;
  },
  addInterns: async (data: { unitId?: string; input: any }) => {
    const response = await api.post("/admin/users/add-interns", data);
    return response.data;
  },
  updateStatus: async (
    id: string,
    data: { isApproved?: boolean; rejectionReason?: string; unitId?: string },
  ) => {
    const response = await api.patch(`/admin/users/${id}/status`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
};

// Email Campaign API
export const emailCampaignApi = {
  getRecipients: async (params: any) => {
    const response = await api.get("/admin/campaign/recipients", { params });
    return response.data;
  },
  previewEmail: async (data: EmailPreviewRequest) => {
    const formData = new FormData();
    data.recipientIds.forEach((id) => formData.append("recipientIds", id));
    formData.append("subject", data.subject);
    formData.append("headerTitle", data.headerTitle);
    formData.append("bodyContent", data.bodyContent);
    if (data.attachments) {
      data.attachments.forEach((file) => formData.append("attachments", file));
    }
    const response = await api.post("/admin/campaign/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  sendCampaign: async (data: SendCampaignRequest) => {
    const formData = new FormData();
    data.recipientIds.forEach((id) => formData.append("recipientIds", id));
    formData.append("subject", data.subject);
    formData.append("headerTitle", data.headerTitle);
    formData.append("bodyContent", data.bodyContent);
    if (data.attachments) {
      data.attachments.forEach((file) => formData.append("attachments", file));
    }
    const response = await api.post("/admin/campaign/send", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

export default api;
