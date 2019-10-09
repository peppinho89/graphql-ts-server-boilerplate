import { Connection } from "typeorm";
import * as Redis from "ioredis";
import fetch from "node-fetch";

import { createConfirmEmailLink } from "./createConfirmEmailLink";
import { User } from "../entity/User";
import { createTestConn } from "../testUtils/createTestConn";

const redis = new Redis();
const baseUrl = "http://localhost:4000";

let userId = "";

let connection: Connection;

beforeAll(async () => {
  connection = await createTestConn(true);

  const user = await User.create({
    email: "bob@bob.com",
    password: "bobby"
  }).save();
  userId = user.id;
});

afterAll(async () => {
  await connection.close();
  redis.disconnect();
});

describe("Create confirm email link", () => {
  test("Check confirm and clear key in redis cache", async () => {
    const url = await createConfirmEmailLink(baseUrl, userId, redis);
    console.log(url);
    const response = await fetch(url);
    const text = await response.text();
    console.log(text);
    expect(text).toEqual("ok");
    const user = await User.findOne({ where: { id: userId } });
    expect((user as User).confirmed).toBeTruthy();
    const chunks = url.split("/");
    const key = chunks[chunks.length - 1];
    const value = await redis.get(key);
    expect(value).toBeNull();
  });

  test("sends invalid back if bad id sent", async () => {
    const response = await fetch(`${baseUrl}/confirm/123456`);
    const text = await response.text();
    expect(text).toEqual("ko");
  });
});
