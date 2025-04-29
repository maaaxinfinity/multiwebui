import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { TaskStatus } from '@/types/api';
import { apiService } from '@/services/api';

interface Task {
  id: string;
  status: TaskStatus | null;
  lastUpdated: number;
}

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

  // 从本地存储恢复任务列表
  useEffect(() => {
    const savedTasks = localStorage.getItem('olmocr-tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Failed to parse saved tasks:', error);
      }
    }
  }, []);

  // 保存任务列表到本地存储
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('olmocr-tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

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

  // 刷新所有任务状态
  const refreshAllTasks = async () => {
    for (const task of tasks) {
      await refreshTask(task.id);
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
