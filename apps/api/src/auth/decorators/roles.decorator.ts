import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";

/** Marks a route as requiring at least one of the given role names (checked against the access token's `roles` claim). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
