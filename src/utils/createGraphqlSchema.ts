import * as path from "path";
import { fileLoader, mergeResolvers, mergeTypes } from "merge-graphql-schemas";
import { makeExecutableSchema } from "graphql-tools";

export const createGraphqlSchema = () => {
  const typesArray = fileLoader(
    path.join(__dirname, "../modules/**/*.graphql")
  );

  const resolversArray = fileLoader(
    path.join(__dirname, "../modules/**/resolvers.*"),
    { extensions: [".ts"] }
  );

  const mappedArray = resolversArray.map(x => {
    return x.resolvers;
  });

  return makeExecutableSchema({
    typeDefs: mergeTypes(typesArray, { all: true }),
    resolvers: mergeResolvers(mappedArray)
  });
};
