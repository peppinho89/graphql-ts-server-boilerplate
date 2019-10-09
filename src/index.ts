import "reflect-metadata";
import "dotenv/config";
import * as express from "express";
import { ApolloServer } from "apollo-server-express";
import * as Redis from "ioredis";

import { createGraphqlSchema } from "./utils/createGraphqlSchema";
import { createTestConn } from "./testUtils/createTestConn";
import { createTypeormConn } from "./utils/createTypeOrmConn";
import { confirmEmail } from "./routes/confirmEmail";

var redis = new Redis();

const startServer = async () => {
  const server = new ApolloServer({
    schema: createGraphqlSchema(),
    context: ({ request }: any) => ({
      redis,
      url: request.protocol + "://" + request.get("host")
    })
  });

  const app = express();

  app.get("/confirm/:id", confirmEmail);

  server.applyMiddleware({ app });

  if (process.env.NODE_ENV === "test") {
    await createTestConn();
  } else {
    await createTypeormConn();
  }

  app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
};

startServer();
