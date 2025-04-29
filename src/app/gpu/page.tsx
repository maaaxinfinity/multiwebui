"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, AlertCircle, BarChart3, Cpu, MemoryStick, HardDrive } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { MainLayout } from "@/components/layout/main-layout";
import { apiService } from "@/services/api";
import type { SystemStatus } from "@/types/api";

export default function SystemStatusPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSystemStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = await apiService.getSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error("Failed to load system status:", error);
      setError("无法获取系统状态信息");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSystemStatus();
    const interval = setInterval(() => {
      loadSystemStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatGb = (gb: number): string => {
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">系统状态</h1>
            <p className="text-muted-foreground mt-1">
              监控系统 CPU, GPU, 和内存使用情况
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSystemStatus}
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

        {systemStatus && !error && (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" /> CPU 状态
                </CardTitle>
                <CardDescription>
                  逻辑核心: {systemStatus.cpu.logical_count} / 物理核心: {systemStatus.cpu.physical_count}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">CPU 使用率</span>
                  <span className="text-sm text-muted-foreground">
                    {systemStatus.cpu.percent_usage.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={systemStatus.cpu.percent_usage}
                  className="h-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" /> GPU 状态
                </CardTitle>
                <CardDescription>GPU 设备状态和使用情况</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">GPU 利用率</span>
                    <span className="text-sm text-muted-foreground">
                      {systemStatus.gpu.gpu_utilization_percent.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={systemStatus.gpu.gpu_utilization_percent}
                    className="h-2"
                    indicatorClassName="bg-green-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">GPU 显存使用</span>
                    <span className="text-sm text-muted-foreground">
                      {formatGb(systemStatus.gpu.memory_used_gb)} / {formatGb(systemStatus.gpu.memory_total_gb)}
                    </span>
                  </div>
                  <Progress
                    value={systemStatus.gpu.memory_used_percent}
                    className="h-2"
                  />
                   <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>已用: {formatGb(systemStatus.gpu.memory_used_gb)}</span>
                      <span>总量: {formatGb(systemStatus.gpu.memory_total_gb)}</span>
                  </div>
                </div>
                 <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">内存控制器利用率</span>
                    <span className="text-sm text-muted-foreground">
                     {systemStatus.gpu.memory_controller_utilization_percent.toFixed(1)}%
                    </span>
                  </div>
                   <Progress
                    value={systemStatus.gpu.memory_controller_utilization_percent}
                    className="h-2"
                    indicatorClassName="bg-blue-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <MemoryStick className="h-5 w-5" /> 主内存状态
                </CardTitle>
                <CardDescription>系统内存使用情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">内存使用率</span>
                  <span className="text-sm text-muted-foreground">
                    {systemStatus.memory.percent_used.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={systemStatus.memory.percent_used}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>已用: {formatGb(systemStatus.memory.used_gb)}</span>
                    <span>可用: {formatGb(systemStatus.memory.available_gb)}</span>
                    <span>总量: {formatGb(systemStatus.memory.total_gb)}</span>
                </div>
              </CardContent>
            </Card>

             {systemStatus.numa?.available && (
              <Card className="lg:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" /> NUMA 信息
                  </CardTitle>
                  <CardDescription>{systemStatus.numa.nodes_summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {systemStatus.numa.raw_output}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}

         <Card className="mt-6">
          <CardHeader>
            <CardTitle>系统监控说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p className="text-muted-foreground">
              系统状态监控显示了 CPU、GPU 和主内存的使用情况和资源。这些信息可以帮助您了解系统资源的使用情况，
              优化处理任务的性能和吞吐量。
            </p>
            <div className="bg-muted p-3 rounded-md space-y-2">
              <h3 className="font-medium">指标说明</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>CPU 使用率</strong>: 所有核心的平均使用百分比。</li>
                <li><strong>GPU 利用率</strong>: GPU 计算单元的使用百分比。</li>
                <li><strong>GPU 显存使用</strong>: GPU 专用内存的使用量和总量。</li>
                 <li><strong>内存控制器利用率</strong>: GPU 内存控制器的繁忙程度。</li>
                <li><strong>主内存使用率</strong>: 系统 RAM 的使用百分比。</li>
                <li><strong>NUMA 信息</strong>: 非统一内存访问架构详情（如果可用）。</li>
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
