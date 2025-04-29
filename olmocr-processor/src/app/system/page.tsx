"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MainLayout } from "@/components/layout/main-layout";
import { apiService } from "@/services/api";

export default function SystemPage() {
  const [isClearing, setIsClearing] = useState<{
    temp: boolean;
    processed: boolean;
  }>({
    temp: false,
    processed: false,
  });

  // 清除临时工作区
  const clearTempWorkspace = async () => {
    setIsClearing((prev) => ({ ...prev, temp: true }));
    try {
      const response = await apiService.clearTempWorkspace();
      toast.success(response.message, {
        description: "临时工作区已清除",
      });
    } catch (error) {
      console.error("Failed to clear temp workspace:", error);
      toast.error("清除临时工作区失败", {
        description: "请稍后重试",
      });
    } finally {
      setIsClearing((prev) => ({ ...prev, temp: false }));
    }
  };

  // 清除处理数据
  const clearProcessedData = async () => {
    setIsClearing((prev) => ({ ...prev, processed: true }));
    try {
      const response = await apiService.clearProcessedData();
      toast.success(response.message, {
        description: "所有处理数据已清除",
      });
    } catch (error) {
      console.error("Failed to clear processed data:", error);
      toast.error("清除处理数据失败", {
        description: "请稍后重试",
      });
    } finally {
      setIsClearing((prev) => ({ ...prev, processed: false }));
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">系统管理</h1>
          <p className="text-muted-foreground mt-1">
            管理系统缓存和处理数据
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 清除临时工作区 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash className="h-5 w-5 text-amber-500" />
                清除临时工作区
              </CardTitle>
              <CardDescription>
                清除OLMOCR使用的临时文件和工作目录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                临时工作区包含处理文件时创建的临时文件和中间结果。清除这些文件不会影响已完成的处理结果。
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={clearTempWorkspace}
                disabled={isClearing.temp}
              >
                {isClearing.temp ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    清除中...
                  </>
                ) : (
                  <>
                    <Trash className="h-4 w-4 mr-2" />
                    清除临时工作区
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* 清除所有处理数据 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                清除所有处理数据
              </CardTitle>
              <CardDescription>
                删除所有已处理的PDF、生成的HTML和JSONL文件
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                此操作将删除所有已上传的PDF文件、生成的HTML预览和JSONL数据文件。此操作不可恢复，请谨慎操作。
              </p>
            </CardContent>
            <CardFooter>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={isClearing.processed}
                  >
                    {isClearing.processed ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        清除中...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        清除所有处理数据
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      确认删除所有处理数据
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作将永久删除所有已处理的PDF文件、HTML预览和JSONL数据文件。此操作不可恢复。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={clearProcessedData}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      确认删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>系统管理说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div>
              <h3 className="font-medium mb-1">清除临时工作区</h3>
              <p className="text-muted-foreground">
                在处理PDF文件时，OLMOCR会创建临时文件和工作目录。随着时间推移，这些文件可能会占用大量磁盘空间。
                清除临时工作区可以释放这些空间，但不会影响已完成的处理结果。建议定期清理。
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">清除所有处理数据</h3>
              <p className="text-muted-foreground">
                此操作将删除所有已上传的PDF文件、生成的HTML预览和JSONL数据文件。这些数据被用于预览、导出和查看处理结果。
                删除后，将无法再查看这些结果，除非重新上传和处理文件。此操作不可恢复，请在确保数据已备份或不再需要后操作。
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 rounded-md">
              <div className="flex items-center gap-2 font-medium mb-1">
                <AlertTriangle className="h-4 w-4" />
                注意事项
              </div>
              <p className="text-sm">
                清除操作可能需要一些时间，尤其是文件数量较多时。在操作完成前，请不要关闭或刷新页面。
                如果遇到问题，请联系系统管理员。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
