import { ForbiddenException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { AccessTokenPayload } from "../jwt-payload.interface";
import { RolesGuard } from "./roles.guard";

function createContext(user: AccessTokenPayload | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  function createGuard(requiredRoles: string[] | undefined) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  }

  it("allows the request when no roles are required", () => {
    const guard = createGuard(undefined);
    expect(guard.canActivate(createContext(undefined))).toBe(true);
  });

  it("allows the request when the user has a required role", () => {
    const guard = createGuard(["admin"]);
    const context = createContext({
      sub: "a1",
      type: "admin",
      roles: ["admin"],
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws ForbiddenException when the user lacks every required role", () => {
    const guard = createGuard(["admin"]);
    const context = createContext({ sub: "u1", type: "user", roles: ["user"] });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("throws ForbiddenException when there is no authenticated user at all", () => {
    const guard = createGuard(["admin"]);
    expect(() => guard.canActivate(createContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
