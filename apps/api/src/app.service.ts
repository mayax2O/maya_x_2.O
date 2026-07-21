import { Injectable } from "@nestjs/common";

/**
 * M0 scaffolding only. Domain services (Booking, Talent, Membership, ...)
 * arrive as their own modules starting M1 — this service exists solely to
 * prove the Nest bootstrap and DI container are wired correctly.
 */
@Injectable()
export class AppService {
  getInfo(): { name: string; status: string } {
    return { name: "MAYA_X_2.0 API", status: "bootstrapped" };
  }

  getHealth(): { status: "ok"; uptimeSeconds: number; timestamp: string } {
    return {
      status: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
