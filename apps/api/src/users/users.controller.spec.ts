import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import type { UserResponse } from "./user.response";

describe("UsersController", () => {
  let controller: UsersController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const userResponse: UserResponse = {
    id: "22222222-2222-2222-2222-222222222222",
    email: "user@example.com",
    fullName: "Test User",
    phone: "+919812345600",
    emailVerifiedAt: null,
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
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = moduleRef.get(UsersController);
  });

  it("wraps a created user in a data envelope", async () => {
    service.create.mockResolvedValue(userResponse);

    const result = await controller.create({
      email: "user@example.com",
      fullName: "Test User",
    });

    expect(result).toEqual({ data: userResponse });
  });

  it("wraps a paginated list in data + meta", async () => {
    service.findAll.mockResolvedValue({ items: [userResponse], total: 1 });

    const result = await controller.findAll({ page: 1, perPage: 20 });

    expect(result).toEqual({
      data: [userResponse],
      meta: { page: 1, perPage: 20, total: 1 },
    });
  });

  it("wraps a single user in a data envelope", async () => {
    service.findOne.mockResolvedValue(userResponse);

    const result = await controller.findOne(userResponse.id);

    expect(result).toEqual({ data: userResponse });
  });

  it("wraps an updated user in a data envelope", async () => {
    service.update.mockResolvedValue(userResponse);

    const result = await controller.update(userResponse.id, {
      fullName: "Updated",
    });

    expect(result).toEqual({ data: userResponse });
  });

  it("delegates deletion with no response body", async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove(userResponse.id);

    expect(service.remove).toHaveBeenCalledWith(userResponse.id);
    expect(result).toBeUndefined();
  });
});
