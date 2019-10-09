import "reflect-metadata";
import "dotenv/config";
import * as express from "express";
import { ApolloServer } from "apollo-server-express";
import { createConnection } from "typeorm";
import * as Redis from "ioredis";

import { createGraphqlSchema } from "./utils/createGraphqlSchema";
import { User } from "./entity/User";

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

  app.get("/confirm/:id", async (req, res) => {
    const { id } = req.params;
    const userId = await redis.get(id);
    if (userId) {
      User.update({ id: userId }, { confirmed: true });
      await redis.del(id);
      res.send("ok");
    } else {
      res.send("ko");
    }
  });

  server.applyMiddleware({ app });

  await createConnection();

  app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
};

startServer();
