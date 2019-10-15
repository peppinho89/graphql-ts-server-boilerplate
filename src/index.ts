import "reflect-metadata";
import "dotenv/config";
import * as express from "express";
import * as session from "express-session";
import { ApolloServer } from "apollo-server-express";
import * as Redis from "ioredis";
import * as connectRedis from "connect-redis";

import { createGraphqlSchema } from "./utils/createGraphqlSchema";
import { createTestConn } from "./testUtils/createTestConn";
import { createTypeormConn } from "./utils/createTypeOrmConn";
import { confirmEmail } from "./routes/confirmEmail";
import { redisSessionPrefix } from "./constants";

let redis = new Redis();
const SESSION_SECRET = "ajslkjalksjdfkl";
const RedisStore = connectRedis(session as any);

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

  app.use(
    session({
      store: new RedisStore({
        client: redis as any,
        prefix: redisSessionPrefix
      }),
      name: "qid",
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      }
    } as any)
  );

  const cors = {
    credentials: true,
    origin:
      process.env.NODE_ENV === "test"
        ? "*"
        : (process.env.FRONTEND_HOST as string)
  };

  server.applyMiddleware({ app, cors });

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
