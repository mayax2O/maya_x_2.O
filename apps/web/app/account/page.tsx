"use client";

import { Button } from "@maya-x/ui";
import { useRouter } from "next/navigation";

import { RequireAuth } from "../../components/auth/RequireAuth";
import { BookingHistoryList } from "../../components/booking/BookingHistoryList";
import { Container } from "../../components/layout/Container";
import { useAuth } from "../../lib/auth/AuthContext";

function AccountContent() {
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-lg">
        <p className="text-[13px] font-semibold uppercase tracking-widest text-brass-deep">
          Account
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          {user?.fullName}
        </h1>
        <p className="mt-1 text-[14.5px] text-slate">{user?.email}</p>

        <Button
          type="button"
          variant="secondary"
          className="mt-8"
          onClick={handleLogout}
        >
          Log out
        </Button>

        <div className="mt-12">
          <h2 className="font-display text-xl font-semibold text-ink">
            My bookings
          </h2>
          <div className="mt-4">
            <BookingHistoryList />
          </div>
        </div>
      </div>
    </Container>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountContent />
    </RequireAuth>
  );
}
