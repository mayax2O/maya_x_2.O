import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "../../components/layout/Container";
import { RegisterForm } from "../../components/forms/RegisterForm";

export const metadata: Metadata = {
  title: "Register | MAYA_X",
  description:
    "Create a MAYA_X account to book talent and manage your membership.",
};

// Section: Registration form
export default function RegisterPage() {
  return (
    <Container className="flex justify-center py-16 sm:py-24">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-[14.5px] text-slate">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-brass-deep hover:text-brass"
          >
            Log in
          </Link>
        </p>

        <div className="mt-8">
          <RegisterForm />
        </div>
      </div>
    </Container>
  );
}
