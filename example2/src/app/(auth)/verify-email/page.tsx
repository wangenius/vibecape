"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      
      if (!token) {
        setStatus("error");
        setMessage("验证链接无效，请检查邮件中的链接");
        return;
      }

      try {
        // 调用 Better Auth 的邮件验证 API
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("邮箱验证成功！正在跳转到登录页面...");
          
          // 3 秒后自动跳转到登录页
          setTimeout(() => {
            router.push("/signin");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "验证失败，请重试或联系客服");
        }
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "验证过程中发生错误");
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {status === "verifying" && "验证中..."}
            {status === "success" && "✅ 验证成功"}
            {status === "error" && "❌ 验证失败"}
          </CardTitle>
          <CardDescription className="text-center">
            {status === "verifying" && "正在验证你的邮箱地址"}
            {status === "success" && "你的邮箱已成功验证"}
            {status === "error" && "邮箱验证失败"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            {status === "verifying" && (
              <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
            )}
            {status === "success" && (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-16 w-16 text-red-500" />
            )}

            <div className="text-center">
              {status === "verifying" && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    请稍候，我们正在验证你的邮箱...
                  </p>
                </div>
              )}
              
              {status === "success" && (
                <div className="space-y-2">
                  <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <p className="font-medium">{message}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    你现在可以使用注册的邮箱和密码登录了！
                  </p>
                </div>
              )}
              
              {status === "error" && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    <p className="font-medium">{message}</p>
                  </div>
                  
                  <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-left">
                    <p className="font-medium mb-2">💡 可能的原因：</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>验证链接已过期（超过 24 小时）</li>
                      <li>验证链接已被使用</li>
                      <li>链接格式不正确</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          {status === "success" && (
            <Button asChild className="w-full">
              <Link href="/signin">
                立即登录
              </Link>
            </Button>
          )}
          
          {status === "error" && (
            <div className="w-full space-y-2">
              <Button asChild className="w-full">
                <Link href="/signup">
                  重新注册
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/signin">
                  返回登录
                </Link>
              </Button>
            </div>
          )}

          <div className="text-sm text-fd-muted-foreground text-center">
            需要帮助？{" "}
            <Link href="/support" className="text-fd-primary hover:underline">
              联系客服
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center px-4 py-12" />}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
