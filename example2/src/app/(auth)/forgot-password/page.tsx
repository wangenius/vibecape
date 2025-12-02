"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        setError(data.error || "发送失败，请重试");
      }
    } catch (err: any) {
      setError(err.message || "发送失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              📧 检查你的邮箱
            </CardTitle>
            <CardDescription>我们已发送密码重置邮件</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <p className="font-medium mb-2">✅ 重置邮件已发送！</p>
                <p>请检查邮箱：</p>
                <p className="font-medium mt-1">{email}</p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>📨 请按照以下步骤重置密码：</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>打开你的邮箱</li>
                  <li>查找密码重置邮件</li>
                  <li>点击邮件中的重置链接</li>
                  <li>设置新密码</li>
                </ol>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/signin">返回登录</Link>
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
          <CardTitle className="text-2xl font-bold">忘记密码</CardTitle>
          <CardDescription>
            输入你的邮箱地址，我们将发送重置密码的链接
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "发送中..." : "发送重置邮件"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-fd-muted-foreground text-center w-full">
            记得密码了？{" "}
            <Link href="/signin" className="text-fd-primary hover:underline">
              返回登录
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
