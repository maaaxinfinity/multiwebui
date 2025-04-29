"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, AlertCircle, BarChart3, Cpu } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { MainLayout } from "@/components/layout/main-layout";
import { apiService } from "@/services/api";
import type { GPUStatus } from "@/types/api";

export default function GpuPage() {
  const [gpuStatus, setGpuStatus] = useState<GPUStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载GPU状态
  const loadGpuStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = await apiService.getGpuStatus();
      setGpuStatus(status);
    } catch (error) {
      console.error("Failed to load GPU status:", error);
      setError("无法获取GPU状态信息");
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadGpuStatus();
    // 自动刷新间隔
    const interval = setInterval(() => {
      loadGpuStatus();
    }, 10000); // 每10秒刷新一次

    return () => clearInterval(interval);
  }, []);

  // 格式化内存显示
  const formatMemory = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(0)} MB`;
    } else {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">GPU状态</h1>
            <p className="text-muted-foreground mt-1">
              监控系统GPU使用情况和资源
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadGpuStatus}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  更新中
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="pt-6 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {gpuStatus && gpuStatus.status === "success" && gpuStatus.gpus && (
          <div className="grid gap-6">
            {gpuStatus.gpus.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <Cpu className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">系统未检测到GPU设备</p>
                </CardContent>
              </Card>
            ) : (
              gpuStatus.gpus.map((gpu) => (
                <Card key={gpu.index}>
                  <CardHeader className="pb-2">
                    <CardTitle>GPU {gpu.index}: {gpu.name}</CardTitle>
                    <CardDescription>GPU设备状态和使用情况</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* 内存使用 */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">内存使用</span>
                          <span className="text-sm text-muted-foreground">
                            {formatMemory(gpu.memory_used)} / {formatMemory(gpu.memory_total)}
                          </span>
                        </div>
                        <Progress
                          value={(gpu.memory_used / gpu.memory_total) * 100}
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>已用: {formatMemory(gpu.memory_used)}</span>
                          <span>空闲: {formatMemory(gpu.memory_free)}</span>
                        </div>
                      </div>

                      <Separator />

                      {/* GPU利用率 */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">GPU利用率</span>
                          <span className="text-sm text-muted-foreground">
                            {gpu.utilization}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-muted-foreground" />
                          <Progress
                            value={gpu.utilization}
                            className="h-2 flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {gpuStatus && gpuStatus.status !== "success" && (
          <Card>
            <CardContent className="pt-6 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="text-amber-600 dark:text-amber-400">
                {gpuStatus.error || "GPU监控无法正常工作"}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>GPU监控说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p className="text-muted-foreground">
              GPU状态监控显示了系统中可用的GPU设备、内存使用情况和利用率。这些信息可以帮助您了解系统资源的使用情况，
              优化PDF处理任务的性能和吞吐量。
            </p>
            <div className="bg-muted p-3 rounded-md space-y-2">
              <h3 className="font-medium">指标说明</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>内存使用</strong>: GPU内存的已用量和总量，高内存使用可能导致处理任务受限</li>
                <li><strong>GPU利用率</strong>: GPU计算单元的使用百分比，表示当前GPU的工作负载</li>
              </ul>
            </div>
            <p className="text-muted-foreground">
              数据每10秒自动更新一次，也可以手动点击刷新按钮获取最新状态。
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
