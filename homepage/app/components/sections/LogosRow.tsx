import type { FC } from "react";
import { Badge } from "@/components/ui/badge";

const providers = [
  "Clerk",
  "Stripe",
  "Supabase",
  "Resend",
  "Cloudinary",
  "Mixpanel",
  "Vercel",
];

export const LogosRow: FC = () => {
  return (
    <section className="py-10 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground mb-5">
          First‑class integrations. One command to set up.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {providers.map((name) => (
            <Badge variant="secondary" key={name} className="px-3 py-1 text-sm">
              {name}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogosRow;
