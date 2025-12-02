"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const paramToken = searchParams.get("token") ?? "";
    if (paramToken) {
      setToken(paramToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("链接无效，请重新请求密码重置邮件");
      return;
    }

    if (password.length < 8) {
      setError("新密码至少需要 8 个字符");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.status === false) {
        throw new Error(data?.error || data?.message || "重置失败，请稍后再试");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "重置失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">密码已更新</CardTitle>
            <CardDescription>现在可以使用新密码登录啦</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              出于安全考虑，建议你尽快登录确认一下账号状态。如果不是你本人请求的重置，请立即联系我们。
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/signin">前往登录</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">重置密码</CardTitle>
          <CardDescription>设置一个新密码来保护你的账户</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">新密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 8 位字符"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                disabled={loading}
                required
              />
            </div>

            {!token && (
              <p className="text-sm text-muted-foreground">
                未检测到有效的重置链接，请返回邮箱重新点击邮件中的按钮。如果链接已过期，<Link href="/forgot-password" className="text-fd-primary hover:underline">重新发送</Link> 即可。
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading || !token}>
              {loading ? "提交中..." : "更新密码"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground text-center">
          <p>
            没有收到重置邮件？{" "}
            <Link href="/forgot-password" className="text-fd-primary hover:underline">
              重新发送
            </Link>
          </p>
          <p>
            记起密码了？{" "}
            <Link href="/signin" className="text-fd-primary hover:underline">
              返回登录
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center px-4 py-12" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
