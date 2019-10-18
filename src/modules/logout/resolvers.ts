import { IResolvers } from "graphql-tools";
import { removeAllUserSessions } from "../../utils/removeAllUserSession";

export const resolvers: IResolvers = {
  Mutation: {
    logout: async (_, __, { session, redis }) => {
      const { userId } = session;

      if (userId) {
        removeAllUserSessions(userId, redis);
        session.destroy((err: any) => {
          if (err) {
            console.log(err);
          }
        });
        return true;
      }
      return false;
    }
  }
};
