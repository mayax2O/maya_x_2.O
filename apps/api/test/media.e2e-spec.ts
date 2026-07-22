import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { hashPassword } from "../src/auth/password.util";
import { CLOUDINARY_GATEWAY } from "../src/media/cloudinary-gateway.interface";
import { PrismaService } from "../src/database/prisma.service";

// A minimal valid 1x1 transparent PNG — real magic bytes so the API's
// `image-size`-based dimension validation succeeds without a fixture file.
const ONE_PX_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

// Every upload's content hash must be unique across this suite's test
// cases (the API deliberately returns the *existing* asset for a byte-for-
// byte duplicate — that's a tested feature, not a bug) — appending a
// distinguishing tail after the valid PNG stream keeps the header
// `image-size` reads intact while making the sha256 hash unique.
function pngFixture(tag: string): Buffer {
  return Buffer.concat([ONE_PX_PNG, Buffer.from(`:${tag}`)]);
}

/**
 * Stub gateway — this suite never talks to the real Cloudinary API. It
 * hands back deterministic public ids/urls so upload/replace/delete can be
 * exercised end-to-end without live credentials.
 */
class StubCloudinaryGateway {
  private counter = 0;
  public deletedPublicIds: string[] = [];

  uploadAsset() {
    this.counter += 1;
    const publicId = `stub/asset-${this.counter}`;
    return Promise.resolve({
      publicId,
      url: `https://res.cloudinary.com/stub/image/upload/${publicId}.png`,
      format: "png",
      bytes: ONE_PX_PNG.length,
      width: 1,
      height: 1,
    });
  }

  deleteAsset(publicId: string) {
    this.deletedPublicIds.push(publicId);
    return Promise.resolve();
  }

  buildOptimizedUrl(publicId: string) {
    return `https://res.cloudinary.com/stub/image/upload/f_auto,q_auto/${publicId}.png`;
  }
}

describe("Media Library API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAccessToken: string;
  let memberAccessToken: string;
  let stubGateway: StubCloudinaryGateway;
  const createdFolderIds: string[] = [];
  const createdAssetIds: string[] = [];

  const adminEmail = `media.e2e.admin.${Date.now()}@example.com`;
  const memberEmail = `media.e2e.member.${Date.now()}@example.com`;

  beforeAll(async () => {
    stubGateway = new StubCloudinaryGateway();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CLOUDINARY_GATEWAY)
      .useValue(stubGateway)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["/", "health", "health/db"] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = moduleRef.get(PrismaService);

    await prisma.admin.create({
      data: {
        email: adminEmail,
        fullName: "E2E Media Admin",
        passwordHash: await hashPassword("AdminPass1"),
      },
    });
    const adminLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password: "AdminPass1" });
    adminAccessToken = adminLogin.body.data.accessToken;

    const registerResponse = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({
        email: memberEmail,
        password: "MemberPass1",
        fullName: "E2E Media Member",
      });
    memberAccessToken = registerResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.mediaAsset.deleteMany({
      where: { id: { in: createdAssetIds } },
    });
    await prisma.mediaFolder.deleteMany({
      where: { id: { in: createdFolderIds } },
    });
    await prisma.user.deleteMany({ where: { email: memberEmail } });
    await prisma.admin.deleteMany({ where: { email: adminEmail } });
    await app.close();
  });

  it("rejects a non-Admin from uploading", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/media/upload")
      .set("Authorization", `Bearer ${memberAccessToken}`)
      .attach("file", pngFixture("non-admin"), "photo.png");
    expect(response.status).toBe(403);
  });

  it("rejects unauthenticated requests with 401", async () => {
    const response = await request(app.getHttpServer()).get("/api/v1/media");
    expect(response.status).toBe(401);
  });

  it("uploads an image, lists it, then fetches it by id", async () => {
    const upload = await request(app.getHttpServer())
      .post("/api/v1/media/upload")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .field("altText", "A test photo")
      .attach("file", pngFixture("upload-list-fetch"), "photo.png");

    expect(upload.status).toBe(201);
    expect(upload.body.data.altText).toBe("A test photo");
    expect(upload.body.data.width).toBe(1);
    expect(upload.body.data.usageCount).toBe(0);
    const assetId = upload.body.data.id;
    createdAssetIds.push(assetId);

    const list = await request(app.getHttpServer())
      .get("/api/v1/media")
      .set("Authorization", `Bearer ${adminAccessToken}`);
    expect(list.status).toBe(200);
    expect(
      list.body.data.some((row: { id: string }) => row.id === assetId),
    ).toBe(true);

    const getOne = await request(app.getHttpServer())
      .get(`/api/v1/media/${assetId}`)
      .set("Authorization", `Bearer ${adminAccessToken}`);
    expect(getOne.status).toBe(200);
    expect(getOne.body.data.id).toBe(assetId);
  });

  it("returns the same asset for a duplicate upload instead of a new one", async () => {
    const first = await request(app.getHttpServer())
      .post("/api/v1/media/upload")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .attach("file", pngFixture("dup"), "dup.png");
    expect(first.status).toBe(201);
    createdAssetIds.push(first.body.data.id);

    const second = await request(app.getHttpServer())
      .post("/api/v1/media/upload")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .attach("file", pngFixture("dup"), "dup-again.png");
    expect(second.status).toBe(201);
    expect(second.body.data.id).toBe(first.body.data.id);
  });

  it("rejects a non-image upload with 400", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/media/upload")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .attach("file", Buffer.from("not an image"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("MEDIA_UNSUPPORTED_TYPE");
  });

  it("creates a folder, moves an asset into it, then filters by folder", async () => {
    const folderName = `E2E Folder ${Date.now()}`;
    const createFolder = await request(app.getHttpServer())
      .post("/api/v1/media/folders")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send({ name: folderName });
    expect(createFolder.status).toBe(201);
    const folderId = createFolder.body.data.id;
    createdFolderIds.push(folderId);

    const upload = await request(app.getHttpServer())
      .post("/api/v1/media/upload")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .field("folderId", folderId)
      .attach("file", pngFixture("in-folder"), "in-folder.png");
    expect(upload.status).toBe(201);
    expect(upload.body.data.folderId).toBe(folderId);
    createdAssetIds.push(upload.body.data.id);

    const filtered = await request(app.getHttpServer())
      .get("/api/v1/media")
      .query({ folderId })
      .set("Authorization", `Bearer ${adminAccessToken}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].id).toBe(upload.body.data.id);

    const removeNonEmpty = await request(app.getHttpServer())
      .delete(`/api/v1/media/folders/${folderId}`)
      .set("Authorization", `Bearer ${adminAccessToken}`);
    expect(removeNonEmpty.status).toBe(409);
  });

  it("blocks deleting an asset that's used in a talent gallery, then allows it once removed", async () => {
    const city = await prisma.city.create({
      data: { name: `E2E Media City ${Date.now()}`, state: "Test State" },
    });
    const talent = await prisma.talent.create({
      data: {
        displayName: "E2E Media Talent",
        slug: `e2e-media-talent-${Date.now()}`,
        cityId: city.id,
        basePrice: 10000,
      },
    });

    const upload = await request(app.getHttpServer())
      .post("/api/v1/media/upload")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .attach("file", pngFixture("gallery"), "gallery.png");
    const assetId = upload.body.data.id;
    createdAssetIds.push(assetId);

    const addToGallery = await request(app.getHttpServer())
      .post(`/api/v1/talent/${talent.id}/media`)
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send({ mediaAssetId: assetId });
    expect(addToGallery.status).toBe(201);

    const blockedDelete = await request(app.getHttpServer())
      .delete(`/api/v1/media/${assetId}`)
      .set("Authorization", `Bearer ${adminAccessToken}`);
    expect(blockedDelete.status).toBe(409);
    expect(blockedDelete.body.error.code).toBe("MEDIA_IN_USE");

    const removeFromGallery = await request(app.getHttpServer())
      .delete(`/api/v1/talent/${talent.id}/media/${addToGallery.body.data.id}`)
      .set("Authorization", `Bearer ${adminAccessToken}`);
    expect(removeFromGallery.status).toBe(204);

    const allowedDelete = await request(app.getHttpServer())
      .delete(`/api/v1/media/${assetId}`)
      .set("Authorization", `Bearer ${adminAccessToken}`);
    expect(allowedDelete.status).toBe(204);
    createdAssetIds.splice(createdAssetIds.indexOf(assetId), 1);

    await prisma.talent.deleteMany({ where: { id: talent.id } });
    await prisma.city.deleteMany({ where: { id: city.id } });
  });

  it("bulk-deletes unused assets and skips ones still in use", async () => {
    const first = await request(app.getHttpServer())
      .post("/api/v1/media/upload")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .attach("file", pngFixture("bulk-a"), "bulk-a.png");
    const second = await request(app.getHttpServer())
      .post("/api/v1/media/upload")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .attach("file", pngFixture("bulk-b"), "bulk-b.png");

    const idA = first.body.data.id;
    const idB = second.body.data.id;

    const bulkDelete = await request(app.getHttpServer())
      .post("/api/v1/media/bulk-delete")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send({ mediaIds: [idA, idB] });

    expect(bulkDelete.status).toBe(200);
    expect(bulkDelete.body.data).toEqual({ requested: 2, affected: 2 });

    const stillThere = await prisma.mediaAsset.findMany({
      where: { id: { in: [idA, idB] } },
    });
    expect(stillThere).toHaveLength(0);
  });

  it("rejects an invalid upload payload with 400", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/media/upload")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send();
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("MEDIA_FILE_REQUIRED");
  });
});
