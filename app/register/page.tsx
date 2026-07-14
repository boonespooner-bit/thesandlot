import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/AuthForms";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-3xl font-black">Join The Sandlot</h1>
      <p className="mb-6 text-night/70">
        Make a parent account so you can add your kids and sign them up to
        play.
      </p>
      <div className="rounded-2xl bg-chalk p-6 shadow">
        <RegisterForm />
      </div>
      <p className="mt-4 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-field underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
