"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ClipboardCopy, RefreshCw, Trash, Eye, AlertCircle, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/main-layout";
import { useTask } from "@/context/task-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function TasksPage() {
  const { tasks, activeTaskId, setActiveTaskId, removeTask, refreshTask, refreshAllTasks } = useTask();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // 自动刷新任务状态
  useEffect(() => {
    const interval = setInterval(() => {
      const processingTasks = tasks.filter(task =>
        task.status?.status === "queued" || task.status?.status === "processing"
      );

      if (processingTasks.length > 0) {
        processingTasks.forEach(task => {
          refreshTask(task.id);
        });
      }
    }, 5000); // 每5秒刷新一次正在处理的任务

    return () => clearInterval(interval);
  }, [tasks, refreshTask]);

  // 手动刷新所有任务
  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await refreshAllTasks();
      toast.success("所有任务状态已更新");
    } catch (error) {
      toast.error("更新任务状态失败");
    } finally {
      setRefreshing(false);
    }
  };

  // 复制任务ID
  const copyTaskId = (taskId: string) => {
    navigator.clipboard.writeText(taskId);
    toast.success("任务ID已复制到剪贴板");
  };

  // 删除任务
  const handleRemoveTask = (taskId: string) => {
    removeTask(taskId);
    toast.success("任务已从列表中移除");
  };

  // 查看任务详情
  const handleViewTask = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  // 根据状态获取任务列表
  const filteredTasks = activeTab === "all"
    ? tasks
    : tasks.filter(task => task.status?.status === activeTab);

  // 获取任务状态标签
  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "queued":
        return <Badge variant="outline" className="status-queued">排队中</Badge>;
      case "processing":
        return <Badge variant="outline" className="status-processing">处理中</Badge>;
      case "completed":
        return <Badge variant="outline" className="status-completed">已完成</Badge>;
      case "failed":
        return <Badge variant="outline" className="status-failed">失败</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  // 找到选中的任务
  const selectedTask = selectedTaskId ? tasks.find(task => task.id === selectedTaskId) : null;

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">任务管理</h1>
            <p className="text-muted-foreground mt-1">
              查看和管理您的OLMOCR处理任务
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  更新中
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新全部
                </>
              )}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">全部任务</TabsTrigger>
            <TabsTrigger value="queued">排队中</TabsTrigger>
            <TabsTrigger value="processing">处理中</TabsTrigger>
            <TabsTrigger value="completed">已完成</TabsTrigger>
            <TabsTrigger value="failed">失败</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-4">
            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">没有{activeTab === "all" ? "" : "此状态的"}任务</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredTasks.map((task) => (
                  <Card
                    key={task.id}
                    className={activeTaskId === task.id ? "border-2 border-primary" : ""}
                    onClick={() => setActiveTaskId(task.id)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-medium">
                            {task.status?.original_filename || task.id}
                          </CardTitle>
                          {getStatusBadge(task.status?.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyTaskId(task.id);
                            }}
                            title="复制任务ID"
                          >
                            <ClipboardCopy className="h-4 w-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewTask(task.id);
                                }}
                                title="查看详情"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>任务详情</DialogTitle>
                              </DialogHeader>
                              {selectedTask?.status && (
                                <div className="mt-2 space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm font-medium">任务ID</p>
                                      <p className="text-sm text-muted-foreground break-all">{selectedTask.id}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">状态</p>
                                      <p className="text-sm">{getStatusBadge(selectedTask.status.status)}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">原始文件名</p>
                                      <p className="text-sm text-muted-foreground">{selectedTask.status.original_filename}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">处理模式</p>
                                      <p className="text-sm text-muted-foreground">{selectedTask.status.mode === "normal" ? "普通模式" : "快速模式"}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">开始时间</p>
                                      <p className="text-sm text-muted-foreground">
                                        {format(new Date(selectedTask.status.start_time * 1000), "yyyy-MM-dd HH:mm:ss")}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">已用时间</p>
                                      <p className="text-sm text-muted-foreground">{selectedTask.status.elapsed_time_seconds.toFixed(2)}秒</p>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-sm font-medium mb-1">处理参数</p>
                                    <div className="bg-muted p-2 rounded-md text-xs font-mono overflow-x-auto">
                                      <pre>{JSON.stringify(selectedTask.status.params, null, 2)}</pre>
                                    </div>
                                  </div>

                                  <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="logs">
                                      <AccordionTrigger className="text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                          <Terminal className="h-4 w-4" />
                                          日志信息
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <div className="bg-muted p-2 rounded-md text-xs font-mono h-60 overflow-y-auto">
                                          {selectedTask.status.logs.length > 0 ? (
                                            <pre className="whitespace-pre-wrap">
                                              {selectedTask.status.logs.join("\n")}
                                            </pre>
                                          ) : (
                                            <p className="text-muted-foreground">暂无日志信息</p>
                                          )}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>

                                    {selectedTask.status.error && (
                                      <AccordionItem value="error">
                                        <AccordionTrigger className="text-sm font-medium text-destructive">
                                          <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            错误信息
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                          <div className="bg-destructive/10 p-2 rounded-md text-xs font-mono text-destructive overflow-x-auto">
                                            <pre className="whitespace-pre-wrap">{selectedTask.status.error}</pre>
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>
                                    )}
                                  </Accordion>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTask(task.id);
                            }}
                            title="从列表中移除"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="flex flex-col md:flex-row gap-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">任务ID: </span>
                          <span className="font-mono">{task.id.substring(0, 10)}...</span>
                        </div>
                        {task.status && (
                          <>
                            <div className="text-sm md:ml-4">
                              <span className="text-muted-foreground">模式: </span>
                              <span>{task.status.mode === "normal" ? "普通" : "快速"}</span>
                            </div>
                            <div className="text-sm md:ml-4">
                              <span className="text-muted-foreground">开始时间: </span>
                              <span>
                                {format(new Date(task.status.start_time * 1000), "yyyy-MM-dd HH:mm:ss")}
                              </span>
                            </div>
                            <div className="text-sm md:ml-4">
                              <span className="text-muted-foreground">用时: </span>
                              <span>{task.status.elapsed_time_seconds.toFixed(2)}秒</span>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
