import { Connection } from "typeorm";
import * as Redis from "ioredis";

import { graphqlTestCall } from "../../tests/graphqlTestCall";
import { createTestConn } from "../../tests/createTestConn";
import { User } from "../../entity/User";

const context = {
  redis: new Redis(),
  url: "http://localhost:4000"
};

let connection: Connection;

beforeAll(async () => {
  connection = await createTestConn();
});

afterAll(async () => {
  await connection.close();
  context.redis.disconnect();
});

const registerMutation = `
mutation RegisterMutation($email: String!, $password: String!) {
  register(email: $email, password: $password){
    path
    message
  }
}
`;

describe("Register user", () => {
  test("Register user", async () => {
    const testUser = { email: "bob@bob.com", password: "bob" };

    const registerResponse: any = await graphqlTestCall(
      registerMutation,
      {
        email: testUser.email,
        password: testUser.password
      },
      context
    );

    expect(registerResponse).toEqual({ data: { register: null } });

    const dbUser = await User.findOne({ where: { email: testUser.email } });

    expect(dbUser).toBeDefined();
    expect(dbUser!.email).toEqual(testUser.email);
    expect(dbUser!.password).not.toEqual(testUser.password);
  });

  test("Catch duplicate email", async () => {
    const testUser = { email: "bob@bob.com", password: "bob" };

    const registerResponse2: any = await graphqlTestCall(
      registerMutation,
      {
        email: testUser.email,
        password: testUser.password
      },
      context
    );

    expect(registerResponse2.data.register).toHaveLength(1);
    expect(registerResponse2.data.register[0].path).toEqual("email");
  });

  test("Catch bad email", async () => {
    const testUser = { email: "bob", password: "bob" };

    const registerResponse: any = await graphqlTestCall(
      registerMutation,
      {
        email: testUser.email,
        password: testUser.password
      },
      context
    );

    expect(registerResponse.data.register).toHaveLength(1);
    expect(registerResponse.data.register[0].path).toEqual("email");
  });

  test("Catch bad password", async () => {
    const testUser = { email: "bob@bob.com", password: "bo" };

    const registerResponse: any = await graphqlTestCall(
      registerMutation,
      {
        email: testUser.email,
        password: testUser.password
      },
      context
    );

    expect(registerResponse.data.register).toHaveLength(1);
    expect(registerResponse.data.register[0].path).toEqual("password");
  });

  test("Catch bad email and password", async () => {
    const testUser = { email: "bob", password: "bo" };

    const registerResponse: any = await graphqlTestCall(
      registerMutation,
      {
        email: testUser.email,
        password: testUser.password
      },
      context
    );

    expect(registerResponse.data.register).toHaveLength(2);
    expect(registerResponse.data.register[0].path).toEqual("email");
    expect(registerResponse.data.register[1].path).toEqual("password");
  });
});
