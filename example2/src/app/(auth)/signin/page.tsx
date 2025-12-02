"use client";

import { Suspense, useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Github } from "lucide-react";

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: next,
      });
      
      // 检查是否需要邮件验证
      if (result.error) {
        const errorMessage = result.error.message || "登录失败";
        
        // 如果是邮箱未验证错误
        if (errorMessage.includes("email") && errorMessage.includes("verif")) {
          setError("⚠️ 请先验证你的邮箱。我们已发送验证邮件到你的邮箱，请查收并点击链接完成验证。");
        } else {
          setError(errorMessage);
        }
      } else {
        router.push(next);
      }
    } catch (err: any) {
      const errorMessage = err.message || "登录失败，请检查邮箱和密码";
      
      // 检查是否是邮箱未验证
      if (errorMessage.includes("email") && (errorMessage.includes("verif") || errorMessage.includes("not verified"))) {
        setError("⚠️ 请先验证你的邮箱。我们已发送验证邮件到你的邮箱，请查收并点击链接完成验证。");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      await signIn.social({
        provider: "github",
        callbackURL: next,
      });
    } catch (err: any) {
      setError(err.message || "GitHub 登录失败");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">登录</CardTitle>
          <CardDescription>
            输入您的邮箱和密码登录账户
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
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>

          <div className="mt-4 text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-fd-primary hover:underline"
            >
              忘记密码？
            </Link>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-fd-background px-2 text-fd-muted-foreground">
                或使用
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={handleGithubSignIn}
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub 登录
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-fd-muted-foreground text-center">
            还没有账户？{" "}
            <Link href="/signup" className="text-fd-primary hover:underline">
              注册
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center px-4 py-12" />}>
      <SignInPageContent />
    </Suspense>
  );
}
