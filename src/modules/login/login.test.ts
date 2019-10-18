import { User } from "../../entity/User";
import { Connection } from "typeorm";
import { TestClient } from "../../testUtils/TestClient";
import { createTestConn } from "../../testUtils/createTestConn";

const email = "bob2@test.com";
const password = "bob2";

let conn: Connection;
beforeAll(async () => {
  conn = await createTestConn();
});
afterAll(async () => {
  conn.close();
});

const loginExpectError = async (
  client: TestClient,
  e: string,
  p: string,
  errMsg: string
) => {
  const response = await client.login(e, p);

  expect(response.data).toEqual({
    login: [
      {
        path: "login",
        message: errMsg
      }
    ]
  });
};

describe("login", () => {
  test("email not found send back error", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    await loginExpectError(
      client,
      "bob@bob.com",
      "whatever",
      "username or password invalid"
    );
  });

  test("email not confirmed", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    await client.register(email, password);

    await loginExpectError(
      client,
      email,
      password,
      "please confirm your email"
    );

    await User.update({ email }, { confirmed: true });

    await loginExpectError(
      client,
      email,
      "aslkdfjaksdljf",
      "username or password invalid"
    );

    const response = await client.login(email, password);

    expect(response.data).toEqual({ login: null });
  });
});
