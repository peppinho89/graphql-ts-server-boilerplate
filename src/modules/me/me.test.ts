import axios from "axios";
import { Connection } from "typeorm";
import { createTestConn } from "../../testUtils/createTestConn";
import { User } from "../../entity/User";

let connection: Connection;

const email = "bob@bob.com";
const password = "bobby";

beforeAll(async () => {
  connection = await createTestConn(true);
  await User.create({
    email: email,
    password: password,
    confirmed: true
  }).save();
});

afterAll(async () => {
  await connection.close();
});

const loginMutation = (e: string, p: string) => `
mutation {
  login(email: "${e}", password: "${p}") {
    path
    message
  }
}
`;

const meQuery = `
{
    me {
        id
        email
    }
}
`;

describe("me query", () => {
  //test("can't get user if not logged in", async () => {});

  test("get current user", async () => {
    await axios.post(
      process.env.TEST_HOST as string,
      {
        query: loginMutation(email, password)
      },
      {
        withCredentials: true
      }
    );

    const response2 = await axios.post(
      process.env.TEST_HOST as string,
      {
        query: meQuery
      },
      {
        withCredentials: true
      }
    );

    console.log(response2.data);
  });
});
