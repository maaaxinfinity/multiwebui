export interface ApiError {
  error: string;
}

export interface TaskResponse {
  message: string;
  task_id: string;
}

export type TaskStatusState = 'queued' | 'processing' | 'completed' | 'failed';
export type ProcessingMode = 'normal' | 'fast';

export interface TaskStatus {
  status: TaskStatusState;
  mode: ProcessingMode;
  start_time: number; // Unix timestamp
  original_filename: string;
  logs: string[];
  params: Record<string, any>; // Consider defining more specific types if params structure is known
  result: {
    jsonl_path: string | null;
    html_path: string | null;
  };
  error: string | null;
  olmocr_stdout: string;
  olmocr_stderr: string;
  elapsed_time_seconds: number;
}

export interface FileList {
  preview_files?: string[]; // Adjusted based on schema ambiguity
  jsonl_files?: string[];   // Adjusted based on schema ambiguity
}

export interface ClearCacheResponse {
  status: string;
  message: string;
}

export interface GPUInfo {
  index: number;
  name: string;
  memory_total: number;
  memory_used: number;
  memory_free: number;
  utilization: number;
}

export interface GPUStatus {
  status: string;
  error: string | null;
  gpus: GPUInfo[] | null;
}

// Interface for the /process request body parameters
export interface ProcessRequestParams {
  mode?: ProcessingMode;
  target_dim: number;
  anchor_len: number;
  max_context: number;
  error_rate?: number;   // Required in normal mode
  max_retries?: number; // Required in normal mode
}
