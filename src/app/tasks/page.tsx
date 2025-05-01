"use client";

import React, { useEffect, useState, useMemo, MouseEvent, ChangeEvent } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ClipboardCopy, RefreshCw, Trash, Eye, AlertCircle, Terminal, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/main-layout";
import { useTask, Task, TaskStatus } from "@/context/task-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiService } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";

const getStatusBadge = (status: TaskStatus['status'] | undefined): React.ReactNode => {
  switch (status) {
    case "queued":
      return <Badge className="bg-gray-100 text-gray-700 border-gray-300">排队中</Badge>;
    case "processing":
      return <Badge className="bg-blue-100 text-blue-700 border-blue-300">处理中</Badge>;
    case "completed":
      return <Badge className="bg-green-100 text-green-700 border-green-300">已完成</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-700 border-red-300">失败</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-700 border-gray-300">未知</Badge>;
  }
};

export default function TasksPage() {
  const { tasks, activeTaskId, setActiveTaskId, removeTask, refreshAllTasks } = useTask();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTaskIdForDialog, setSelectedTaskIdForDialog] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredTasks = useMemo(() => {
    return activeTab === "all"
      ? tasks
      : tasks.filter((task: Task) => task.status && task.status.status === activeTab);
  }, [tasks, activeTab]);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    setSelectedTaskIds(new Set());
    try {
      await refreshAllTasks();
      toast.success("所有任务状态已更新");
    } catch (error) {
      toast.error("更新任务状态失败");
    } finally {
      setRefreshing(false);
    }
  };

  const copyTaskId = (taskId: string) => {
    navigator.clipboard.writeText(taskId);
    toast.success("任务ID已复制到剪贴板");
  };

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      const allFilteredIds = new Set(filteredTasks.map(task => task.id));
      setSelectedTaskIds(allFilteredIds);
    } else {
      setSelectedTaskIds(new Set());
    }
  };

  const handleSelectRow = (taskId: string, checked: boolean) => {
    setSelectedTaskIds(prev => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(taskId);
      } else {
        newSelection.delete(taskId);
      }
      return newSelection;
    });
  };

  const isAllFilteredSelected = useMemo(() => {
      if (filteredTasks.length === 0) return false;
      return filteredTasks.every(task => selectedTaskIds.has(task.id));
  }, [filteredTasks, selectedTaskIds]);

   const selectAllCheckedState = useMemo(() => {
     if (isAllFilteredSelected) return true;
     if (selectedTaskIds.size > 0) return 'indeterminate';
     return false;
   }, [isAllFilteredSelected, selectedTaskIds.size]);

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    const idsToDelete = Array.from(selectedTaskIds);
    let successCount = 0;
    let errorCount = 0;

    for (const taskId of idsToDelete) {
      try {
        await apiService.deleteTaskWithFiles(taskId);
        removeTask(taskId);
        successCount++;
      } catch (error: unknown) {
        errorCount++;
        console.error(`Failed to delete task ${taskId}:`, error);
        const errorMsg = error instanceof Error ? error.message : "未知错误";
        toast.error(`删除任务 ${taskId.substring(0, 8)}... 失败`, { description: errorMsg });
      }
    }

    setIsDeleting(false);
    setSelectedTaskIds(new Set());

    if (successCount > 0) {
      toast.success(`${successCount} 个任务已成功删除`);
    }
    if (errorCount > 0 && successCount === 0) {
       toast.error(`所有选定任务删除失败`);
    }
  };

  const handleViewTask = (taskId: string) => {
    setSelectedTaskIdForDialog(taskId);
  };

  const selectedTaskDetails = selectedTaskIdForDialog
    ? tasks.find(task => task.id === selectedTaskIdForDialog)?.status
    : null;

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">任务管理</h1>
            <p className="text-muted-foreground mt-1">
              查看和管理您的OLMOCR处理任务
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
             <AlertDialog>
                <AlertDialogTrigger asChild>
                   <Button
                      variant="destructive"
                      size="sm"
                      disabled={selectedTaskIds.size === 0 || isDeleting}
                      className="gap-1"
                    >
                       {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                       ) : (
                           <Trash2 className="h-4 w-4" />
                       )}
                       删除选中 ({selectedTaskIds.size})
                   </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除?</AlertDialogTitle>
                    <AlertDialogDescription>
                       将永久删除 {selectedTaskIds.size} 个选中的任务及其关联的 HTML 和 JSONL 文件。此操作无法撤销。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteSelected}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                     >
                      {isDeleting ? "删除中..." : "确认删除"}
                   </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
             </AlertDialog>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={refreshing || isDeleting}
              className="gap-1"
            >
              {refreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                  <RefreshCw className="h-4 w-4" />
              )}
              刷新全部
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => { setActiveTab(value); setSelectedTaskIds(new Set()); }}>
          <TabsList>
             <TabsTrigger value="all">全部 ({tasks.length})</TabsTrigger>
             <TabsTrigger value="queued">排队中 ({tasks.filter(t => t.status?.status === 'queued').length})</TabsTrigger>
             <TabsTrigger value="processing">处理中 ({tasks.filter(t => t.status?.status === 'processing').length})</TabsTrigger>
             <TabsTrigger value="completed">已完成 ({tasks.filter(t => t.status?.status === 'completed').length})</TabsTrigger>
             <TabsTrigger value="failed">失败 ({tasks.filter(t => t.status?.status === 'failed').length})</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-4">
             {filteredTasks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">没有{activeTab === "all" ? "" : `"${activeTab}"状态的`}任务</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-md border">
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead className="w-[50px] px-4">
                           <Checkbox
                              checked={selectAllCheckedState}
                              onCheckedChange={(checked) => handleSelectAll(checked as boolean | "indeterminate")}
                              aria-label="Select all"
                            />
                         </TableHead>
                         <TableHead>文件名 / 任务ID</TableHead>
                         <TableHead>状态</TableHead>
                         <TableHead>模式</TableHead>
                         <TableHead>开始时间</TableHead>
                         <TableHead>用时</TableHead>
                         <TableHead className="text-right pr-4">操作</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {filteredTasks.map((task: Task) => (
                         <TableRow
                            key={task.id}
                            data-state={selectedTaskIds.has(task.id) ? "selected" : undefined}
                            className={`cursor-pointer ${activeTaskId === task.id ? "bg-muted/50" : ""}`}
                            onClick={() => setActiveTaskId(task.id)}
                          >
                            <TableCell className="px-4">
                               <Checkbox
                                 checked={selectedTaskIds.has(task.id)}
                                 onCheckedChange={(checked) => handleSelectRow(task.id, !!checked)}
                                 onClick={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                                 aria-label="Select row"
                               />
                             </TableCell>
                             <TableCell>
                                <div className="font-medium truncate max-w-xs" title={task.status?.original_filename || task.id}>
                                  {task.status?.original_filename || "-"}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono" title={task.id}>
                                   {task.id.substring(0, 12)}...
                                </div>
                             </TableCell>
                             <TableCell>{getStatusBadge(task.status?.status)}</TableCell>
                             <TableCell>{task.status?.mode === "normal" ? "普通" : (task.status?.mode === "fast" ? "快速" : "-")}</TableCell>
                             <TableCell>
                                {task.status ? format(new Date(task.status.start_time * 1000), "yyyy-MM-dd HH:mm:ss") : '-'}
                             </TableCell>
                             <TableCell>{task.status ? `${task.status.elapsed_time_seconds.toFixed(1)}秒` : '-'}</TableCell>
                             <TableCell className="text-right pr-4">
                                  <Dialog onOpenChange={(open) => { if (!open) setSelectedTaskIdForDialog(null); }}>
                                    <DialogTrigger asChild>
                                       <Button
                                         variant="ghost"
                                         size="icon"
                                         onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                           e.stopPropagation();
                                           handleViewTask(task.id);
                                         }}
                                         title="查看详情"
                                         disabled={!task.status}
                                       >
                                          <Eye className="h-4 w-4" />
                                       </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl">
                                      <DialogHeader>
                                        <DialogTitle>任务详情: {task.status?.original_filename || task.id}</DialogTitle>
                                      </DialogHeader>
                                      {selectedTaskDetails && (
                                        <div className="mt-2 space-y-4 max-h-[70vh] overflow-y-auto pr-6">
                                          <div className="grid grid-cols-2 gap-4">
                                             <div><p className="text-sm font-medium">任务ID</p><p className="text-sm text-muted-foreground break-all">{selectedTaskIdForDialog}</p></div>
                                             <div><p className="text-sm font-medium">状态</p><p className="text-sm">{getStatusBadge(selectedTaskDetails.status)}</p></div>
                                             <div><p className="text-sm font-medium">原始文件名</p><p className="text-sm text-muted-foreground">{selectedTaskDetails.original_filename || '-'}</p></div>
                                             <div><p className="text-sm font-medium">处理模式</p><p className="text-sm text-muted-foreground">{selectedTaskDetails.mode === "normal" ? "普通模式" : "快速模式"}</p></div>
                                             <div><p className="text-sm font-medium">开始时间</p><p className="text-sm text-muted-foreground">{format(new Date(selectedTaskDetails.start_time * 1000), "yyyy-MM-dd HH:mm:ss")}</p></div>
                                             <div><p className="text-sm font-medium">已用时间</p><p className="text-sm text-muted-foreground">{selectedTaskDetails.elapsed_time_seconds.toFixed(2)}秒</p></div>
                                           </div>
                                          {selectedTaskDetails.params && <div><p className="text-sm font-medium mb-1">处理参数</p><div className="bg-muted p-2 rounded-md text-xs font-mono overflow-x-auto"><pre>{JSON.stringify(selectedTaskDetails.params, null, 2)}</pre></div></div>}
                                          <Accordion type="single" collapsible className="w-full">
                                             {selectedTaskDetails.logs && selectedTaskDetails.logs.length > 0 && (<AccordionItem value="logs"><AccordionTrigger>日志信息</AccordionTrigger><AccordionContent><div className="bg-muted p-2 rounded-md text-xs font-mono h-60 overflow-y-auto"><pre className="whitespace-pre-wrap">{selectedTaskDetails.logs.join("\n")}</pre></div></AccordionContent></AccordionItem>)}
                                             {selectedTaskDetails.olmocr_stdout && (<AccordionItem value="stdout"><AccordionTrigger>OLMOCR 标准输出</AccordionTrigger><AccordionContent><div className="bg-muted p-2 rounded-md text-xs font-mono h-60 overflow-y-auto"><pre className="whitespace-pre-wrap">{selectedTaskDetails.olmocr_stdout}</pre></div></AccordionContent></AccordionItem>)}
                                             {selectedTaskDetails.olmocr_stderr && (<AccordionItem value="stderr"><AccordionTrigger className="text-amber-600 dark:text-amber-400">OLMOCR 标准错误</AccordionTrigger><AccordionContent><div className="bg-muted p-2 rounded-md text-xs font-mono h-60 overflow-y-auto"><pre className="whitespace-pre-wrap">{selectedTaskDetails.olmocr_stderr}</pre></div></AccordionContent></AccordionItem>)}
                                             {selectedTaskDetails.error && (<AccordionItem value="error"><AccordionTrigger className="text-destructive">错误信息</AccordionTrigger><AccordionContent><div className="bg-destructive/10 p-2 rounded-md text-xs font-mono text-destructive overflow-x-auto"><pre className="whitespace-pre-wrap">{selectedTaskDetails.error}</pre></div></AccordionContent></AccordionItem>)}
                                             {selectedTaskDetails.status === "completed" && selectedTaskDetails.result && (<AccordionItem value="result"><AccordionTrigger>结果文件</AccordionTrigger><AccordionContent><div className="space-y-2">{selectedTaskDetails.result.jsonl_path && (<p className="text-sm">JSONL: {selectedTaskDetails.result.jsonl_path}</p>)}{selectedTaskDetails.result.html_path && (<p className="text-sm">HTML: {selectedTaskDetails.result.html_path}</p>)}</div></AccordionContent></AccordionItem>)}
                                          </Accordion>
                                        </div>
                                      )}
                                    </DialogContent>
                                  </Dialog>
                             </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </div>
              )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
