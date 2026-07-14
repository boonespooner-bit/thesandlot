import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/AuthForms";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-black">Welcome back</h1>
      <div className="rounded-2xl bg-chalk p-6 shadow">
        <LoginForm />
      </div>
      <p className="mt-4 text-sm">
        New here?{" "}
        <Link href="/register" className="font-semibold text-field underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
