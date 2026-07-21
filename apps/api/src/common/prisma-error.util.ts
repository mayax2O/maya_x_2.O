import { Prisma } from "@prisma/client";

/** P2002: unique constraint violation (duplicate email/slug/etc.). */
export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/** P2003: foreign key constraint violation — e.g. deleting a City a Location or Talent still references. */
export function isForeignKeyConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}
