import axios from 'axios';
import type {
  TaskResponse,
  TaskStatus,
  FileList,
  ClearCacheResponse,
  SystemStatus,
  ApiError,
  ProcessRequestParams
} from '@/types/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7860';

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器，添加API密钥
api.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('olmocr-api-key');
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }
  return config;
});

// API服务
export const apiService = {
  // 设置API密钥
  setApiKey(apiKey: string): void {
    localStorage.setItem('olmocr-api-key', apiKey);
  },

  // 获取API密钥
  getApiKey(): string | null {
    return localStorage.getItem('olmocr-api-key');
  },

  // 移除API密钥
  removeApiKey(): void {
    localStorage.removeItem('olmocr-api-key');
  },

  // 上传PDF并开始处理
  async processPdf(file: File, params: ProcessRequestParams): Promise<TaskResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Append parameters from ProcessRequestParams
    Object.entries(params).forEach(([key, value]) => {
      // Ensure the key is valid for ProcessRequestParams before appending
      // You might want stricter type checking here depending on ProcessRequestParams definition
      if (value !== undefined && value !== null) {
          formData.append(key, String(value));
      }
    });

    // Log the params being sent (excluding the file)
    console.log("Starting processing with params:", params);

    const response = await api.post<TaskResponse>('/process', formData, {
      headers: {
        // Axios might set this automatically for FormData, but explicit is safer
        'Content-Type': 'multipart/form-data',
      },
      // Consider adding specific error handling for this request if needed
    });
    return response.data;
  },

  // 获取任务状态
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await api.get<TaskStatus>(`/process/${taskId}`);
    return response.data;
  },

  // 获取HTML预览文件列表
  async getFilesList(): Promise<FileList> {
    const response = await api.get<FileList>('/files/previews');
    return response.data;
  },

  // 获取JSONL文件列表
  async getJsonlFiles(): Promise<FileList> {
    const response = await api.get<FileList>('/files/jsonl');
    return response.data;
  },

  // 获取HTML预览文件URL
  getHtmlPreviewUrl(filename: string): string {
    return `${BASE_URL}/files/previews/${filename}`;
  },

  // 获取JSONL文件URL
  getJsonlFileUrl(filename: string): string {
    return `${BASE_URL}/files/jsonl/${filename}`;
  },

  // 导出HTML文件（ZIP）
  getExportHtmlUrl(): string {
    return `${BASE_URL}/export/html`;
  },

  // 导出处理结果（MD或DOCX）
  getExportUrl(format: 'md' | 'docx'): string {
    return `${BASE_URL}/export/${format}`;
  },

  // 清除临时工作区
  async clearTempWorkspace(): Promise<ClearCacheResponse> {
    const response = await api.delete<ClearCacheResponse>('/cache/temp');
    return response.data;
  },

  // 清除处理数据
  async clearProcessedData(): Promise<ClearCacheResponse> {
    const response = await api.delete<ClearCacheResponse>('/cache/processed');
    return response.data;
  },

  // 获取系统状态 (Previously getGpuStatus)
  async getSystemStatus(): Promise<SystemStatus> {
    const response = await api.get<SystemStatus>('/status/system');
    return response.data;
  },

  // 检查API连接
  async checkConnection(): Promise<boolean> {
    try {
      // 尝试获取文件列表作为检查连接的方式
      // Make sure getFilesList is defined correctly above
      await this.getFilesList(); 
      return true;
    } catch (error) {
      console.error("API Connection Check Failed:", error); // Log error for debugging
      return false;
    }
  }
};
