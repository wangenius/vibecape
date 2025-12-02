"use client";

import {
  Mail,
  Twitter,
  Github,
  MessageCircle,
  AtSign,
  Box,
} from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/locales/LanguageProvider";

export const Contact = () => {
  const { dictionary } = useLanguage();
  const contact = dictionary.contact;

  const links = [
    {
      icon: Mail,
      label: contact.email.label,
      value: "wangenius.os@gmail.com",
      href: "mailto:wangenius.os@gmail.com",
      type: "link",
    },
    {
      icon: Twitter,
      label: contact.twitter.label,
      value: "@iamwangenius",
      href: "https://x.com/iamwangenius",
      type: "link",
    },
    {
      icon: Github,
      label: contact.github.label,
      value: "github.com/wangenius",
      href: "https://github.com/wangenius",
      type: "link",
    },
    {
      icon: Box,
      label: contact.bento.label,
      value: "bento.me/wangenius",
      href: "https://bento.me/wangenius",
      type: "link",
    },
    {
      icon: MessageCircle,
      label: contact.wechat.label,
      value: "wzdoing",
      href: null,
      type: "qr",
      qrCode: "/wechat.jpg",
    },
    {
      icon: AtSign,
      label: contact.wechatOfficial.label,
      value: "wangenius",
      href: null,
      type: "text",
    },
  ];

  return (
    <section id="contact" className="mb-32 space-y-12">
      <div className="space-y-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-fd-muted-foreground/60">
          {contact.section.label}
        </p>

        <h2 className="text-3xl font-light tracking-tight text-fd-foreground">
          {contact.section.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
        {links.map((link) => (
          <div key={link.label}>
            {link.type === "link" ? (
              <a
                href={link.href!}
                target={link.href!.startsWith("http") ? "_blank" : undefined}
                rel={
                  link.href!.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="group flex items-start gap-4 transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fd-muted/10 text-fd-muted-foreground/60 group-hover:text-fd-foreground group-hover:bg-fd-muted/20 transition-colors">
                  <link.icon className="h-4 w-4" />
                </div>
                <div className="overflow-hidden pt-1">
                  <p className="text-[10px] font-medium text-fd-muted-foreground/60 uppercase tracking-wider mb-1">
                    {link.label}
                  </p>
                  <p className="text-sm font-medium text-fd-foreground truncate group-hover:text-fd-foreground/80 transition-colors">
                    {link.value}
                  </p>
                </div>
              </a>
            ) : link.type === "qr" ? (
              <div className="group relative flex items-start gap-4 cursor-pointer">
                {/* QR Code Popover */}
                <div className="absolute bottom-full left-0 mb-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-10 origin-bottom-left">
                  <div className="bg-background p-2 rounded-xl shadow-xl border border-border/10">
                    <div className="relative w-32 h-32 bg-white rounded-lg overflow-hidden">
                      <Image
                        src={link.qrCode!}
                        alt={link.label}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fd-muted/10 text-fd-muted-foreground/60 group-hover:text-fd-foreground group-hover:bg-fd-muted/20 transition-colors">
                  <link.icon className="h-4 w-4" />
                </div>
                <div className="pt-1">
                  <p className="text-[10px] font-medium text-fd-muted-foreground/60 uppercase tracking-wider mb-1">
                    {link.label}
                  </p>
                  <p className="text-sm font-medium text-fd-foreground">
                    {link.value}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fd-muted/10 text-fd-muted-foreground/60">
                  <link.icon className="h-4 w-4" />
                </div>
                <div className="pt-1">
                  <p className="text-[10px] font-medium text-fd-muted-foreground/60 uppercase tracking-wider mb-1">
                    {link.label}
                  </p>
                  <p className="text-sm font-medium text-fd-foreground">
                    {link.value}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
