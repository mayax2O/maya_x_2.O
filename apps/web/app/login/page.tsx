import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "../../components/layout/Container";
import { LoginForm } from "../../components/forms/LoginForm";

export const metadata: Metadata = {
  title: "Log in | MAYA_X",
  description:
    "Log in to your MAYA_X account to manage bookings and membership.",
};

export default function LoginPage() {
  return (
    <Container className="flex justify-center py-16 sm:py-24">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-ink">Log in</h1>
        <p className="mt-2 text-[14.5px] text-slate">
          New to MAYA_X?{" "}
          <Link
            href="/register"
            className="font-medium text-brass-deep hover:text-brass"
          >
            Create an account
          </Link>
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </Container>
  );
}
