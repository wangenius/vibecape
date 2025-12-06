import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h2 className="text-4xl font-bold tracking-tight">404</h2>
      <p className="text-muted-foreground mt-4 mb-8 text-lg">Page not found</p>
      <Link
        href="/"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium transition hover:opacity-90"
      >
        Return Home
      </Link>
    </div>
  );
}
