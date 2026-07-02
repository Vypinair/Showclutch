import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <Link href="/" className="mb-8 inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/showclutch-logo.png" alt="ShowClutch" className="h-8 w-auto" />
      </Link>

      <h1 className="font-display text-4xl text-ash">Sign in</h1>
      <p className="mt-2 mb-6 text-ash-2">Log in, or create your ShowClutch account.</p>

      <AuthForm />
    </div>
  );
}
