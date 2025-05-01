import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { TaskStatus } from '@/types/api';
import { apiService } from '@/services/api';

// Export Task and TaskStatus types
export interface Task {
  id: string;
  status: TaskStatus | null;
  lastUpdated: number;
}

export type { TaskStatus };

type TaskContextType = {
  tasks: Task[];
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  addTask: (taskId: string) => void;
  removeTask: (taskId: string) => void;
  refreshTask: (taskId: string) => Promise<void>;
  refreshAllTasks: () => Promise<void>;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // 保存任务列表到本地存储 (只在非首次加载后执行)
  useEffect(() => {
    if (isInitialLoadComplete && tasks.length >= 0) { // Allow saving empty list if cleared
      localStorage.setItem('olmocr-tasks', JSON.stringify(tasks));
    }
  }, [tasks, isInitialLoadComplete]);

  // 刷新所有任务状态 (现在从 /tasks 端点获取)
  const refreshAllTasks = useCallback(async () => {
    console.log("Refreshing all tasks from /tasks endpoint...");
    try {
      const allStatuses = await apiService.getAllTasks();
      // Map the statuses received from the backend to the Task structure
      const updatedTasks = allStatuses.map((status: TaskStatus): Task => ({
        id: status.task_id, // Assuming the task ID is in status.task_id
        status: status,
        lastUpdated: Date.now(),
      }));

      // Sort tasks by start time descending (most recent first)
      updatedTasks.sort((a, b) => {
          const timeA = a.status?.start_time ?? 0;
          const timeB = b.status?.start_time ?? 0;
          return timeB - timeA; // Descending order
      });

      setTasks(updatedTasks);
    } catch (error) {
      console.error('Failed to refresh all tasks:', error);
      // Optionally: Handle error, e.g., show a toast notification
      // You might want to clear tasks or show an error state
      setTasks([]); // Example: Clear tasks on error
    } finally {
       if (!isInitialLoadComplete) {
           setIsInitialLoadComplete(true);
       }
    }
  }, [isInitialLoadComplete]);

  // 首次加载时从 API 获取任务列表
  useEffect(() => {
    if (!isInitialLoadComplete) {
       console.log("Initial task load from API...");
       refreshAllTasks();
    }
  }, [refreshAllTasks, isInitialLoadComplete]); // Add dependencies

  // 添加任务
  const addTask = (taskId: string) => {
    setTasks((prev) => {
      // 检查任务是否已存在
      if (prev.some((task) => task.id === taskId)) {
        return prev;
      }

      return [
        ...prev,
        {
          id: taskId,
          status: null,
          lastUpdated: Date.now(),
        },
      ];
    });

    // 设置为活动任务
    setActiveTaskId(taskId);
  };

  // 移除任务
  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));

    // 如果移除的是当前活动任务，清除活动任务
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  };

  // 刷新单个任务状态
  const refreshTask = async (taskId: string) => {
    try {
      const status = await apiService.getTaskStatus(taskId);

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...task, status, lastUpdated: Date.now() }
            : task
        )
      );
    } catch (error) {
      console.error(`Failed to refresh task ${taskId}:`, error);
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        activeTaskId,
        setActiveTaskId,
        addTask,
        removeTask,
        refreshTask,
        refreshAllTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
}
