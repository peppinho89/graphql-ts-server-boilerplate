import { IResolvers } from "graphql-tools";
import { User } from "../../entity/User";
// import { createMiddleware } from "../../utils/createMiddleware";
// import middleware from "./middleware";

export const resolvers: IResolvers = {
  Query: {
    me: (_, __, context) =>
      User.findOne({ where: { id: context.session.userId } })
  }
};
