import { ServiceUnavailableException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { DatabaseService } from "../database/database.service";
import { HealthService } from "./health.service";

describe("HealthService", () => {
  let service: HealthService;
  let database: { query: jest.Mock };

  beforeEach(async () => {
    database = { query: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: DatabaseService, useValue: database },
      ],
    }).compile();

    service = moduleRef.get(HealthService);
  });

  it("reports ok with a measured latency when the database responds", async () => {
    database.query.mockResolvedValue([{ "?column?": 1 }]);

    const result = await service.checkDatabase();

    expect(database.query).toHaveBeenCalledWith("SELECT 1");
    expect(result.status).toBe("ok");
    expect(result.database).toBe("connected");
    expect(typeof result.latencyMs).toBe("number");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("throws ServiceUnavailableException, without leaking the underlying error, when the query fails", async () => {
    database.query.mockRejectedValue(
      new Error("connection refused: password authentication failed"),
    );

    await expect(service.checkDatabase()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(service.checkDatabase()).rejects.toMatchObject({
      message: "Database connection is unavailable",
    });
  });
});
