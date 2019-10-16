import { request } from "graphql-request";
//import { graphqlTestCall } from "../../testUtils/graphqlTestCall";
import { Connection } from "typeorm";
import { createTestConn } from "../../testUtils/createTestConn";
import { User } from "../../entity/User";

const email = "bob@bob.com";
const password = "password";

let connection: Connection;

beforeAll(async () => {
  connection = await createTestConn(true);
  await request(
    process.env.TEST_HOST as string,
    registerMutation(email, password)
  );
});

afterAll(async () => {
  await connection.close();
});

const registerMutation = (e: string, p: string) => `
mutation {
  register(email: "${e}", password: "${p}") {
    path
    message
  }
}
`;

const loginMutation = (e: string, p: string) => `
mutation {
  login(email: "${e}", password: "${p}") {
    path
    message
  }
}
`;

describe("Login", () => {
  test("email not found", async () => {
    const response = await request(
      process.env.TEST_HOST as string,
      loginMutation("bob2@bob.com", "password")
    );

    expect({ response }).toEqual({
      response: {
        login: [
          {
            path: "login",
            message: "username or password invalid"
          }
        ]
      }
    });
  });

  test("wrong password", async () => {
    const response = await request(
      process.env.TEST_HOST as string,
      loginMutation(email, "wrong")
    );

    expect({ response }).toEqual({
      response: {
        login: [
          {
            path: "login",
            message: "username or password invalid"
          }
        ]
      }
    });
  });

  test("must confirm email", async () => {
    const response = await request(
      process.env.TEST_HOST as string,
      loginMutation(email, password)
    );

    expect({ response }).toEqual({
      response: {
        login: [
          {
            path: "login",
            message: "please confirm your email"
          }
        ]
      }
    });
  });

  test("login success", async () => {
    await User.update({ email }, { confirmed: true });

    const response = await request(
      process.env.TEST_HOST as string,
      loginMutation(email, password)
    );

    expect({ response }).toEqual({
      response: {
        login: null
      }
    });
  });
});
