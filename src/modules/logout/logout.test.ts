import { User } from "../../entity/User";
import { Connection } from "typeorm";
import { TestClient } from "../../testUtils/TestClient";
import { createTestConn } from "../../testUtils/createTestConn";

let conn: Connection;
const email = "bob3@test.com";
const password = "bob3";

let userId: string;

beforeAll(async () => {
  conn = await createTestConn();
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

describe("logout", () => {
  test("multiple session", async () => {
    const session1 = new TestClient(process.env.TEST_HOST as string);
    const session2 = new TestClient(process.env.TEST_HOST as string);

    await session1.login(email, password);
    await session2.login(email, password);

    expect(await session1.me()).toEqual(await session2.me());

    await session1.logout();

    expect(await session1.me()).toEqual(await session2.me());
  }),
    test("test logging out a user", async () => {
      const client = new TestClient(process.env.TEST_HOST as string);

      await client.login(email, password);

      const response = await client.me();

      expect(response.data).toEqual({
        me: {
          id: userId,
          email
        }
      });

      await client.logout();

      const response2 = await client.me();

      expect(response2.data.me).toBeNull();
    });
});
