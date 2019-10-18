import { IResolvers } from "graphql-tools";
import { removeAllUserSessions } from "../../utils/removeAllUserSession";

export const resolvers: IResolvers = {
  Mutation: {
    logout: async (_, __, { session, redis }) => {
      const { userId } = session;

      if (userId) {
        removeAllUserSessions(userId, redis);
        return true;
      }
      return false;
    }
  }
};
