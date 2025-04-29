"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileArchive, FileText, FileJson, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/main-layout";
import { apiService } from "@/services/api";

export default function ExportPage() {
  const [isExporting, setIsExporting] = useState<{
    html: boolean;
    md: boolean;
    docx: boolean;
  }>({
    html: false,
    md: false,
    docx: false,
  });

  // 导出各种格式
  const handleExport = async (format: "html" | "md" | "docx") => {
    setIsExporting((prev) => ({ ...prev, [format]: true }));
    try {
      let url = "";

      if (format === "html") {
        url = apiService.getExportHtmlUrl();
      } else {
        url = apiService.getExportUrl(format);
      }

      // 打开新窗口下载
      window.open(url, "_blank");

      // 显示成功消息
      toast.success(`${getFormatName(format)}导出请求已发送`, {
        description: "如果文件准备好，浏览器将开始下载",
      });
    } catch (error) {
      console.error(`Failed to export ${format}:`, error);
      toast.error(`导出${getFormatName(format)}失败`, {
        description: "请稍后重试",
      });
    } finally {
      // 短暂延迟后重置导出状态
      setTimeout(() => {
        setIsExporting((prev) => ({ ...prev, [format]: false }));
      }, 1000);
    }
  };

  // 获取格式名称
  const getFormatName = (format: string): string => {
    switch (format) {
      case "html":
        return "HTML文件";
      case "md":
        return "Markdown文件";
      case "docx":
        return "Word文档";
      default:
        return format.toUpperCase();
    }
  };

  // 获取格式图标
  const getFormatIcon = (format: string) => {
    switch (format) {
      case "html":
        return <FileText className="h-12 w-12 text-blue-500" />;
      case "md":
        return <FileText className="h-12 w-12 text-green-500" />;
      case "docx":
        return <FileText className="h-12 w-12 text-purple-500" />;
      default:
        return <FileJson className="h-12 w-12 text-gray-500" />;
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">导出结果</h1>
          <p className="text-muted-foreground mt-1">
            将处理结果导出为不同格式
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* HTML导出 */}
          <Card>
            <CardHeader className="text-center">
              {getFormatIcon("html")}
              <CardTitle>HTML导出</CardTitle>
              <CardDescription>
                导出所有HTML预览文件为ZIP压缩包
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleExport("html")}
                disabled={isExporting.html}
                className="gap-2"
              >
                {isExporting.html ? (
                  <>
                    <FileArchive className="h-5 w-5 animate-pulse" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    导出HTML
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Markdown导出 */}
          <Card>
            <CardHeader className="text-center">
              {getFormatIcon("md")}
              <CardTitle>Markdown导出</CardTitle>
              <CardDescription>
                导出所有处理结果为Markdown文档
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleExport("md")}
                disabled={isExporting.md}
                className="gap-2"
              >
                {isExporting.md ? (
                  <>
                    <FileArchive className="h-5 w-5 animate-pulse" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    导出MD
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Word导出 */}
          <Card>
            <CardHeader className="text-center">
              {getFormatIcon("docx")}
              <CardTitle>Word导出</CardTitle>
              <CardDescription>
                导出所有处理结果为Word文档
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleExport("docx")}
                disabled={isExporting.docx}
                className="gap-2"
              >
                {isExporting.docx ? (
                  <>
                    <FileArchive className="h-5 w-5 animate-pulse" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    导出DOCX
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>导出说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <strong>HTML导出：</strong> 将所有HTML预览文件打包为一个ZIP文件，适合离线查看和浏览。
            </p>
            <p>
              <strong>Markdown导出：</strong> 将处理结果转换为Markdown文档，方便在文本编辑器中查看和编辑。
              导出结果包含Markdown文件和原始HTML文件的ZIP压缩包。
            </p>
            <p>
              <strong>Word导出：</strong> 将处理结果转换为Word文档(.docx)格式，适合正式文档和报告。
              导出结果包含Word文档和原始HTML文件的ZIP压缩包。
            </p>
            <p className="text-muted-foreground">
              注意：导出操作可能需要一些时间，尤其是文件数量较多时。如果导出失败，请稍后重试。
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
