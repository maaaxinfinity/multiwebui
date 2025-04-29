"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, RefreshCw, ExternalLink, FileJson, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MainLayout } from "@/components/layout/main-layout";
import { apiService } from "@/services/api";
import type { FileList } from "@/types/api";

export default function FilesPage() {
  const [fileList, setFileList] = useState<FileList>({ preview_files: [], jsonl_files: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("html");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // 加载文件列表
  const loadFiles = async () => {
    setIsLoading(true);
    try {
      // 获取HTML预览文件
      const htmlFiles = await apiService.getFilesList();
      // 获取JSONL文件
      const jsonlFiles = await apiService.getJsonlFiles();

      setFileList({
        preview_files: htmlFiles.preview_files,
        jsonl_files: jsonlFiles.jsonl_files,
      });
    } catch (error) {
      console.error("Failed to load files:", error);
      toast.error("加载文件列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadFiles();
  }, []);

  // Fetch and load HTML preview content
  const loadPreviewHtml = async (filename: string | null) => {
    if (!filename) {
      setPreviewHtml(null);
      setPreviewError(null);
      return;
    }
    setIsPreviewLoading(true);
    setPreviewHtml(null);
    setPreviewError(null);
    try {
      const htmlContent = await apiService.getHtmlPreviewContent(filename);
      setPreviewHtml(htmlContent);
    } catch (error) {
      console.error("Failed to load HTML preview:", error);
      setPreviewError("无法加载预览。请检查API密钥或联系管理员。");
      toast.error("加载预览失败", {
          description: error instanceof Error ? error.message : "无法连接到服务器或未经授权",
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // useEffect to load preview when selectedFile changes for HTML tab
  useEffect(() => {
    if (activeTab === 'html' && selectedFile) {
      loadPreviewHtml(selectedFile);
    } else {
        // Clear preview if tab changes or file is deselected
        setPreviewHtml(null);
        setPreviewError(null);
    }
  }, [selectedFile, activeTab]);

  // Handle preview button click
  const handlePreviewClick = (filename: string) => {
    setSelectedFile(filename);
  };

  // Download function remains mostly the same, but consider implications for protected files
  const handleDownload = (filename: string, type: "html" | "jsonl") => {
    let url = "";
    if (type === "html") {
      url = apiService.getHtmlPreviewUrl(filename);
    } else {
      url = apiService.getJsonlFileUrl(filename);
    }
    // Direct download might fail for protected files if backend requires auth
    // Consider fetching blob via apiService and using FileSaver if direct download fails
    // For now, keep the simple window.open approach
    toast.info(`尝试打开下载链接: ${filename}`, {
        description: "如果文件受保护，直接下载可能失败。"
    })
    window.open(url, "_blank"); 
  };

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">文件浏览</h1>
            <p className="text-muted-foreground mt-1">
              浏览和下载处理后的文件
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadFiles}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  加载中
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

        <Tabs defaultValue="html" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="html" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              HTML预览
            </TabsTrigger>
            <TabsTrigger value="jsonl" className="flex items-center gap-1">
              <FileJson className="h-4 w-4" />
              JSONL数据
            </TabsTrigger>
          </TabsList>

          <TabsContent value="html" className="mt-4">
            {fileList.preview_files.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">暂无HTML预览文件</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {fileList.preview_files.map((filename) => (
                  <Card key={filename}>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base font-medium truncate">{filename}</CardTitle>
                      <CardDescription>HTML预览文件</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex gap-2">
                      <Dialog onOpenChange={(open) => {
                          // When dialog closes, clear selected file to allow re-opening the same file preview
                          if (!open) {
                              setSelectedFile(null); 
                          }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewClick(filename)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            预览
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                          <DialogHeader>
                            <DialogTitle>预览: {filename}</DialogTitle>
                          </DialogHeader>
                          <div className="flex-1 mt-2 border rounded overflow-hidden">
                            {isPreviewLoading && (
                               <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <p className="ml-2 text-muted-foreground">加载预览中...</p>
                              </div>
                            )}
                            {previewError && (
                              <div className="flex items-center justify-center h-full p-4">
                                 <p className="text-red-600 dark:text-red-400 text-center">{previewError}</p>
                              </div>
                            )}
                            {!isPreviewLoading && !previewError && previewHtml && (
                              <iframe
                                srcDoc={previewHtml}
                                className="w-full h-full border-0"
                                title={`预览: ${filename}`}
                                sandbox="allow-scripts allow-same-origin"
                              />
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(filename, "html")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        下载
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="jsonl" className="mt-4">
            {fileList.jsonl_files.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <FileJson className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">暂无JSONL数据文件</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {fileList.jsonl_files.map((filename) => (
                  <Card key={filename}>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base font-medium truncate">{filename}</CardTitle>
                      <CardDescription>JSONL数据文件</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(filename, "jsonl")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        下载
                      </Button>
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
