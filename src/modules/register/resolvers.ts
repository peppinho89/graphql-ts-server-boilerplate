import { IResolvers } from "graphql-tools";
import * as yup from "yup";
//import { v4 } from "uuid";
import { User } from "../../entity/User";
import { formatYupErrors } from "../../utils/formatYupErrors";
import { createConfirmEmailLink } from "./createConfirmEmailLink";
import { sendEmail } from "../../utils/sendEmail";

const schema = yup.object().shape({
  email: yup
    .string()
    .min(3)
    .max(255)
    .email(),
  password: yup
    .string()
    .min(3)
    .max(255)
});

export const resolvers: IResolvers = {
  Query: {
    dummy: () => "dummy"
  },
  Mutation: {
    register: async (
      _,
      args: GQL.IRegisterOnMutationArguments,
      { redis, url }
    ) => {
      try {
        await schema.validate(args, { abortEarly: false });
      } catch (error) {
        return formatYupErrors(error);
      }

      const { email, password } = args;

      const userAlreadyExist = await User.findOne({
        where: { email },
        select: ["id"]
      });

      if (userAlreadyExist) {
        return [
          {
            path: "email",
            message: "Already taken"
          }
        ];
      }

      const user = User.create({
        //id: v4(),
        email,
        password
      });

      await user.save();

      if (process.env.NODE_ENV !== "test") {
        sendEmail(email, await createConfirmEmailLink(url, user.id, redis));
      }

      return null;
    }
  }
};
