import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "http://localhost:3000";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "请输入有效的邮箱地址" },
        { status: 400 },
      );
    }

    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${appUrl}/reset-password`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    const message =
      error instanceof Error ? error.message : "发送失败，请稍后再试";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
