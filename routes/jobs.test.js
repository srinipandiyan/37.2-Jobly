"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST / { job } => { job }", function () {
  test("ok for admin", async function () {
    const resp = await request(app)
        .post(`/jobs`)
        .send({
          title: "newJob",
          salary: 10000,
          equity: "0.3",
          companyHandle: "c1",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "newJob",
        salary: 10000,
        equity: "0.3",
        companyHandle: "c1",
      },
    });
  });

  test("unauthorized for non-admin users", async function () {
    const resp = await request(app)
        .post(`/jobs`)
        .send({
          companyHandle: "c1",
          title: "newJob",
          salary: 10000,
          equity: "0.3",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("throws BadRequestError for missing data", async function () {
    const resp = await request(app)
        .post(`/jobs`)
        .send({
          companyHandle: "c1",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("throws BadRequestError for invalid data types", async function () {
    const resp = await request(app)
        .post(`/jobs`)
        .send({
          companyHandle: 1,
          title: "newJob",
          salary: "10000",
          equity: "0.3",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET / ", function () {
  test("works for anonymous users", async function () {
    const resp = await request(app).get(`/jobs`);
    expect(resp.body).toEqual({
          jobs: [
            {
              id: expect.any(Number),
              title: "J1",
              salary: 100,
              equity: "0.1",
              companyHandle: "c1",
              companyName: "C1",
            },
            {
              id: expect.any(Number),
              title: "J2",
              salary: 200,
              equity: "0.2",
              companyHandle: "c1",
              companyName: "C1",
            },
            {
              id: expect.any(Number),
              title: "J3",
              salary: 300,
              equity: null,
              companyHandle: "c1",
              companyName: "C1",
            },
          ],
        },
    );
  });

  test("works with filtering using hasEquity, ", async function () {
    const resp = await request(app)
        .get(`/jobs`)
        .query({ hasEquity: true });
    expect(resp.body).toEqual({
          jobs: [
            {
              id: expect.any(Number),
              title: "J1",
              salary: 100,
              equity: "0.1",
              companyHandle: "c1",
              companyName: "C1",
            },
            {
              id: expect.any(Number),
              title: "J2",
              salary: 200,
              equity: "0.2",
              companyHandle: "c1",
              companyName: "C1",
            },
          ],
        },
    );
  });

  test("works with filtering with 2 filters, minSalary and title", async function () {
    const resp = await request(app)
        .get(`/jobs`)
        .query({ minSalary: 200, title: "3" });
    expect(resp.body).toEqual({
          jobs: [
            {
              id: expect.any(Number),
              title: "J3",
              salary: 300,
              equity: null,
              companyHandle: "c1",
              companyName: "C1",
            },
          ],
        },
    );
  });

  test("throws BadRequestError with invalid filter key", async function () {
    const resp = await request(app)
        .get(`/jobs`)
        .query({ minSalary: 2, invalidFilter: "invalidKey" });
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/[jobId] => { job }", function () {
  test("works for anonymous user", async function () {
    const resp = await request(app).get(`/jobs/${testJobIds[1]}`);
    expect(resp.body).toEqual({
      job: {
        id: testJobIds[1],
        title: "J2",
        salary: 200,
        equity: "0.2",
        company: {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
      },
    });
  });

  test("throws not found error when job cannot be found", async function () {
    const resp = await request(app).get(`/jobs/123`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /[jobId]  { fld1, fld2, ... } => { job }", function () {
  test("works for admin user", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "J-New",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "J-New",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("unauthorized for non-admin user", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[1]}`)
        .send({
          salary: 2000000,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request when job cannot be found by id", async function () {
    const resp = await request(app)
        .patch(`/jobs/123`)
        .send({
          equity: "0.3",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("throws BadRequestError when attempting to change handle", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[1]}`)
        .send({
          handle: "differentHandle",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("throws BadRequestError with invalid data type", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[1]}`)
        .send({
          equity: 0.2,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `${adminToken}`);
    expect(resp.body).toEqual({ deleted: testJobIds[0] });
  });

  test("throws unauthorized error for non-admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("throws error when job cannot be found by id", async function () {
    const resp = await request(app)
        .delete(`/jobs/123`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});