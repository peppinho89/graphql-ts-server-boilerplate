import { IResolvers } from "graphql-tools";
import { userSessionIdPrefix, redisSessionPrefix } from "../../constants";

export const resolvers: IResolvers = {
  Query: {
    dummy: () => "dummy"
  },
  Mutation: {
    logout: async (_, __, { session, redis }) => {
      const { userId } = session;

      if (userId) {
        const sessionIds = await redis.lrange(
          `${userSessionIdPrefix}${userId}`,
          0,
          -1
        );

        const promises = [];

        for (let i = 0; i < sessionIds.length; i++) {
          promises.push(redis.del(`${redisSessionPrefix}${sessionIds[i]}`));
        }

        await Promise.all(promises);
        return true;
      }
      return false;
    }
  }
};
