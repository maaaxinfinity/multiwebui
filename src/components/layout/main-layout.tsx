"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, UploadCloud, List, Package, Cog, Cpu, HardDrive } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/auth-guard";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      label: "上传处理",
      href: "/",
      icon: <UploadCloud className="h-5 w-5" />,
    },
    {
      label: "任务管理",
      href: "/tasks",
      icon: <List className="h-5 w-5" />,
    },
    {
      label: "文件浏览",
      href: "/files",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      label: "导出结果",
      href: "/export",
      icon: <Package className="h-5 w-5" />,
    },
    {
      label: "系统管理",
      href: "/system",
      icon: <Cog className="h-5 w-5" />,
    },
    {
      label: "系统状态",
      href: "/status",
      icon: <Cpu className="h-5 w-5" />,
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        {/* 顶部导航栏 */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="container flex h-16 items-center">
            <div className="flex items-center gap-2 mr-4 lg:mr-8">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-xl font-bold">OLMOCR</span>
                <span className="text-sm font-medium px-2 py-1 rounded-md bg-primary text-primary-foreground">
                  Processor
                </span>
              </Link>
            </div>

            {/* 桌面导航 */}
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 flex-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* 移动端菜单按钮 */}
            <div className="flex md:hidden flex-1 justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="px-2"
                onClick={toggleMobileMenu}
              >
                <span className="sr-only">Toggle menu</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {isMobileMenuOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="4" y1="8" x2="20" y2="8" />
                      <line x1="4" y1="16" x2="20" y2="16" />
                    </>
                  )}
                </svg>
              </Button>
            </div>

            {/* 登出按钮 */}
            <div className="hidden md:flex">
              <Button variant="outline" size="sm" onClick={logout}>
                退出登录
              </Button>
            </div>
          </div>

          {/* 移动端导航菜单 */}
          {isMobileMenuOpen && (
            <nav className="md:hidden p-4 border-t bg-background">
              <div className="grid gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                      pathname === item.href
                        ? "bg-accent"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  退出登录
                </Button>
              </div>
            </nav>
          )}
        </header>

        {/* 主内容区 */}
        <main className="flex-1 container py-6">{children}</main>

        {/* 页脚 */}
        <footer className="border-t py-4 bg-background">
          <div className="container flex flex-col items-center justify-center gap-1 md:flex-row md:justify-between text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} OLMOCR Processor by Limitee. All rights reserved.</p>
            <p>Version 0.2.0</p>
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}
