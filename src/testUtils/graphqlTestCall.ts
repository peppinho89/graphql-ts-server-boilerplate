import { graphql } from "graphql";
import { createGraphqlSchema } from "../utils/createGraphqlSchema";

const schema = createGraphqlSchema();

export const graphqlTestCall = async (
  query: any,
  variables?: any,
  context?: any
) => {
  return graphql(schema, query, undefined, context, variables);
};
