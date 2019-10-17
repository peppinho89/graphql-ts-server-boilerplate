import { User } from "../../entity/User";
import { Connection } from "typeorm";
import { TestClient } from "../../testUtils/TestClient";
import { createTestConn } from "../../testUtils/createTestConn";
import { createForgotPasswordLink } from "./createForgotPasswordLink";
import * as Redis from "ioredis";
import { forgotPasswordLockAccount } from "../../utils/forgotPasswordLockAccount";

const email = "bob@bob.com";
const password = "bobby";
const newPassword = "newP";

let conn: Connection;
const redis = new Redis();
let userId: string;

beforeAll(async () => {
  conn = await createTestConn(true);
  const user = await User.create({
    email,
    password,
    confirmed: true
  }).save();
  userId = user.id;
});

afterAll(async () => {
  conn.close();
});

describe("forgotPassword", () => {
  test("make sure it works", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    //lock account
    await forgotPasswordLockAccount(userId, redis);

    const url = await createForgotPasswordLink("", userId, redis);
    const parts = url.split("/");
    const key = parts[parts.length - 1];

    //make sure can't login locked account
    expect(await client.login(email, password)).toEqual({
      data: {
        login: [
          {
            path: "login",
            message: "account is locked"
          }
        ]
      }
    });

    //new password too short
    expect(await client.forgotPasswordChange("a", key)).toEqual({
      data: {
        forgotPasswordChange: [
          {
            path: "newPassword",
            message: "newPassword must be at least 3 characters"
          }
        ]
      }
    });

    //const test = await client.forgotPasswordChange("a", key);
    //console.log(test.data);

    const response = await client.forgotPasswordChange(newPassword, key);

    expect(response.data).toEqual({
      forgotPasswordChange: null
    });

    //make sure redis key expires after pwd change
    expect(await client.forgotPasswordChange("dsfsdfdsf", key)).toEqual({
      data: {
        forgotPasswordChange: [
          {
            path: "key",
            message: "key has expired"
          }
        ]
      }
    });

    expect(await client.login(email, newPassword)).toEqual({
      data: {
        login: null
      }
    });

    // expect(await client.me()).toEqual({
    //   data: {
    //     me: {
    //       id: userId,
    //       email
    //     }
    //   }
    // });
  });
});
