import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false, // 改为 false，需要邮件验证后才能登录
    requireEmailVerification: true, // 启用邮件验证
    sendResetPassword: async ({ user, url }) => {
      // 发送密码重置邮件
      if (!process.env.RESEND_API_KEY) {
        console.warn("⚠️ RESEND_API_KEY 未配置，跳过邮件发送");
        return;
      }
      
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: user.email,
        subject: "重置密码",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>重置密码</h2>
            <p>你好 ${user.name},</p>
            <p>我们收到了重置你账户密码的请求。点击下面的按钮重置密码：</p>
            <a href="${url}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 16px 0;">重置密码</a>
            <p>如果你没有请求重置密码，可以忽略这封邮件。</p>
            <p>此链接将在 1 小时后过期。</p>
          </div>
        `,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true, // 注册时自动发送验证邮件
    autoSignInAfterVerification: true, // 验证后自动登录
    sendVerificationEmail: async ({ user, url }) => {
      // 发送邮件验证链接
      if (!process.env.RESEND_API_KEY) {
        console.warn("⚠️ RESEND_API_KEY 未配置，跳过邮件发送");
        console.log("📧 验证链接:", url);
        return;
      }

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: user.email,
        subject: "验证你的邮箱",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>欢迎注册！</h2>
            <p>你好 ${user.name},</p>
            <p>感谢你注册我们的平台。请点击下面的按钮验证你的邮箱地址：</p>
            <a href="${url}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 16px 0;">验证邮箱</a>
            <p>或者复制以下链接到浏览器：</p>
            <p style="color: #666; word-break: break-all;">${url}</p>
            <p>如果你没有注册账户，可以忽略这封邮件。</p>
            <p>此链接将在 24 小时后过期。</p>
          </div>
        `,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      enabled: !!process.env.GITHUB_CLIENT_ID,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
  },
});

