import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController (M0 bootstrap smoke test)", () => {
  let controller: AppController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = moduleRef.get(AppController);
  });

  it("returns bootstrap info from GET /", () => {
    expect(controller.getInfo()).toEqual({
      name: "MAYA_X_2.0 API",
      status: "bootstrapped",
    });
  });

  it("returns a healthy status from GET /health", () => {
    const result = controller.getHealth();
    expect(result.status).toBe("ok");
    expect(typeof result.uptimeSeconds).toBe("number");
  });
});
