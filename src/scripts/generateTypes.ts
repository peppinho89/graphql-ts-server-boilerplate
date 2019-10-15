import { generateNamespace } from "@gql2ts/from-schema";
import * as fs from "fs";
import * as path from "path";
import { createGraphqlSchema } from "../utils/createGraphqlSchema";

const types = generateNamespace("GQL", createGraphqlSchema());
fs.writeFile(path.join(__dirname, "../types/schema.d.ts"), types, err => {
  console.log(err);
});
