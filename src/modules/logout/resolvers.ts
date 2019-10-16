import { IResolvers } from "graphql-tools";

export const resolvers: IResolvers = {
  Query: {
    dummy: () => "dummy"
  },
  Mutation: {
    logout: (_, __, { session }) =>
      new Promise(res =>
        session.destroy((err: any) => {
          if (err) {
            console.log(err);
          } else {
            res(true);
          }
        })
      )
  }
};
