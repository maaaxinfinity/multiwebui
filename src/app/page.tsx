"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, ControllerRenderProps, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FilePond, registerPlugin } from "react-filepond";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/main-layout";
import { apiService } from "@/services/api";
import { useTask } from "@/context/task-context";
import { ProcessRequestParams } from "@/types/api";

// 导入 FilePond 样式
import "filepond/dist/filepond.min.css";

// 注册FilePond插件
registerPlugin(FilePondPluginFileValidateType, FilePondPluginFileValidateSize);

// Base schema with all params optional except mode
const processSchema = z.object({
  mode: z.enum(["normal", "fast"]).default("fast"),
  target_dim: z.coerce.number().int().positive().optional(),
  anchor_len: z.coerce.number().int().positive().optional(),
  max_context: z.coerce.number().int().positive().optional(),
  error_rate: z.coerce.number().min(0).max(1).optional(),
  max_retries: z.coerce.number().int().positive().optional(),
});

// Refine schema: ensure all params are defined when mode is 'normal'
const refinedSchema = processSchema.refine(
  (data: z.infer<typeof processSchema>) => {
    if (data.mode === "normal") {
      return (
        data.target_dim !== undefined &&
        data.anchor_len !== undefined &&
        data.max_context !== undefined &&
        data.error_rate !== undefined &&
        data.max_retries !== undefined
      );
    }
    // For 'fast' mode, only mode is required by this refinement
    return true;
  },
  {
    message: "所有参数在普通模式下都是必需的",
    // Path can be refined later if more specific error messages per field are needed
  }
);

type ProcessFormValues = z.infer<typeof refinedSchema>;

// 定义FilePond文件类型
interface FilePondFile {
  file: File;
  [key: string]: any;
}

export default function HomePage() {
  const router = useRouter();
  const { addTask } = useTask();
  const [files, setFiles] = useState<FilePondFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 表单默认值 - provide defaults for all fields
  const form = useForm<ProcessFormValues>({
    resolver: zodResolver(refinedSchema),
    defaultValues: {
      mode: "fast",
      target_dim: 1024, // Default for when switching to normal
      anchor_len: 32,   // Default for when switching to normal
      max_context: 512, // Default for when switching to normal
      error_rate: 0.03,  // Default shown in fast mode (disabled)
      max_retries: 3,   // Default shown in fast mode (disabled)
    },
  });

  // 监听模式变化
  const selectedMode = form.watch("mode");

  // 处理表单提交 - Handle multiple files
  const onSubmit = async (data: ProcessFormValues) => {
    if (files.length === 0) {
      toast.error("请先上传至少一个PDF文件"); // Updated message
      return;
    }

    setIsSubmitting(true);
    const submittedTaskIds: string[] = [];
    let errorCount = 0;

    // Process each file
    for (const fileItem of files) {
      try {
        const finalParams = {
          mode: data.mode,
          target_dim: data.target_dim,
          anchor_len: data.anchor_len,
          max_context: data.max_context,
          error_rate: data.error_rate,
          max_retries: data.max_retries,
        };

        // Call API for each file
        const response = await apiService.processPdf(fileItem.file, finalParams as any);
        submittedTaskIds.push(response.task_id);
        addTask(response.task_id); // Add each task to context

      } catch (error: unknown) {
        errorCount++;
        console.error(`Error processing file ${fileItem.file.name}:`, error);
        let errorMsg = '处理失败';
         if (error instanceof z.ZodError) {
          errorMsg = error.errors.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
        } else if (error instanceof Error) {
          errorMsg = error.message;
        } else if (typeof error === 'string') {
          errorMsg = error;
        }
        toast.error(`处理文件 ${fileItem.file.name} 失败`, { description: errorMsg });
      }
    }

    setIsSubmitting(false);

    // Show summary toast
    if (submittedTaskIds.length > 0) {
       toast.success(`${submittedTaskIds.length} 个文件已提交处理`, {
         description: `任务ID: ${submittedTaskIds.join(", ")}`,
       });
       // Optionally clear files after successful submission of at least one
       setFiles([]); 
       // Optionally navigate away
       // router.push("/tasks"); 
    }
    if (errorCount > 0 && submittedTaskIds.length === 0) {
         toast.error("所有文件处理失败，请检查错误信息或重试。");
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PDF文件处理</h1>
            <p className="text-muted-foreground mt-1">
              上传PDF文件并使用OLMOCR进行文档处理
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>上传PDF文件</CardTitle>
              <CardDescription>
                选择要处理的PDF文件，文件大小限制为50MB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FilePond
                files={files}
                onupdatefiles={setFiles}
                allowMultiple={true}
                name="files"
                labelIdle='拖放文件或 <span class="filepond--label-action">浏览</span> (可多选)'
                acceptedFileTypes={["application/pdf"]}
                maxFileSize="50MB"
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>处理参数</CardTitle>
              <CardDescription>
                配置OLMOCR处理参数以获得最佳结果
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="mode"
                    render={({ field }: { field: ControllerRenderProps<FieldValues, "mode"> }) => (
                      <FormItem>
                        <FormLabel>处理模式</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择处理模式" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="normal">普通模式（更准确，需额外参数）</SelectItem>
                            <SelectItem value="fast">快速模式（更快）</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          选择处理速度和精度。普通模式需要设置错误率和重试次数。
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Normal Mode Parameters - Conditionally Rendered */}
                  {selectedMode === 'normal' && (
                    <div className="space-y-4 border-t pt-4 mt-4 border-dashed">
                       <p className="text-sm font-medium text-muted-foreground">普通模式参数:</p>
                       <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="target_dim"
                            render={({ field }: { field: ControllerRenderProps<FieldValues, "target_dim"> }) => (
                              <FormItem>
                                <FormLabel>目标尺寸</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormDescription>图像处理的目标尺寸</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="anchor_len"
                            render={({ field }: { field: ControllerRenderProps<FieldValues, "anchor_len"> }) => (
                              <FormItem>
                                <FormLabel>锚点长度</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormDescription>处理锚点的长度</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                       </div>
                      <FormField
                        control={form.control}
                        name="max_context"
                        render={({ field }: { field: ControllerRenderProps<FieldValues, "max_context"> }) => (
                          <FormItem>
                            <FormLabel>最大上下文</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormDescription>最大上下文长度</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Error Rate and Max Retries - Always Rendered, Conditionally Disabled */}
                  <div className={`grid gap-4 md:grid-cols-2 ${selectedMode === 'normal' ? 'border-t pt-4 mt-4 border-dashed' : ''}`}>
                     { /* Add title only in normal mode where other params are also shown */}
                    {selectedMode === 'normal' && <p className="md:col-span-2 text-sm font-medium text-muted-foreground -mb-2">错误率与重试:</p>}
                    <FormField
                      control={form.control}
                      name="error_rate"
                      render={({ field }: { field: ControllerRenderProps<FieldValues, "error_rate"> }) => (
                        <FormItem>
                          <FormLabel>最大错误率</FormLabel>
                          <FormControl>
                            {/* Disabled when fast mode is selected */}
                            <Input type="number" step="0.01" {...field} disabled={selectedMode === 'fast' || isSubmitting} />
                          </FormControl>
                          <FormDescription>允许的最大错误率 (0-1)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="max_retries"
                      render={({ field }: { field: ControllerRenderProps<FieldValues, "max_retries"> }) => (
                        <FormItem>
                          <FormLabel>最大重试次数</FormLabel>
                          <FormControl>
                             {/* Disabled when fast mode is selected */}
                            <Input type="number" {...field} disabled={selectedMode === 'fast' || isSubmitting} />
                          </FormControl>
                          <FormDescription>处理失败时的最大重试次数</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || files.length === 0} 
                    className="w-full"
                  >
                    {isSubmitting ? "处理中..." : `开始处理 ${files.length} 个文件`}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
