import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { AdminsController } from "./admins.controller";
import { AdminsService } from "./admins.service";
import type { AdminResponse } from "./admin.response";

describe("AdminsController", () => {
  let controller: AdminsController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const adminResponse: AdminResponse = {
    id: "11111111-1111-1111-1111-111111111111",
    email: "admin@example.com",
    fullName: "Admin User",
    isActive: true,
    createdAt: new Date("2026-07-21T00:00:00Z"),
    updatedAt: new Date("2026-07-21T00:00:00Z"),
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AdminsController],
      providers: [{ provide: AdminsService, useValue: service }],
    }).compile();

    controller = moduleRef.get(AdminsController);
  });

  it("wraps a created admin in a data envelope", async () => {
    service.create.mockResolvedValue(adminResponse);

    const result = await controller.create({
      email: "admin@example.com",
      fullName: "Admin User",
      password: "Password1",
    });

    expect(result).toEqual({ data: adminResponse });
  });

  it("wraps a paginated list in data + meta", async () => {
    service.findAll.mockResolvedValue({ items: [adminResponse], total: 1 });

    const result = await controller.findAll({ page: 1, perPage: 20 });

    expect(result).toEqual({
      data: [adminResponse],
      meta: { page: 1, perPage: 20, total: 1 },
    });
  });

  it("defaults pagination meta when the query omits it", async () => {
    service.findAll.mockResolvedValue({ items: [], total: 0 });

    const result = await controller.findAll({});

    expect(result.meta).toEqual({ page: 1, perPage: 20, total: 0 });
  });

  it("wraps a single admin in a data envelope", async () => {
    service.findOne.mockResolvedValue(adminResponse);

    const result = await controller.findOne(adminResponse.id);

    expect(service.findOne).toHaveBeenCalledWith(adminResponse.id);
    expect(result).toEqual({ data: adminResponse });
  });

  it("wraps an updated admin in a data envelope", async () => {
    service.update.mockResolvedValue(adminResponse);

    const result = await controller.update(adminResponse.id, {
      fullName: "Updated",
    });

    expect(service.update).toHaveBeenCalledWith(adminResponse.id, {
      fullName: "Updated",
    });
    expect(result).toEqual({ data: adminResponse });
  });

  it("delegates deletion with no response body", async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove(adminResponse.id);

    expect(service.remove).toHaveBeenCalledWith(adminResponse.id);
    expect(result).toBeUndefined();
  });
});
