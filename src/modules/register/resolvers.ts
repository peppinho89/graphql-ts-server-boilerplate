import { IResolvers } from "graphql-tools";
import * as bcrypt from "bcrypt";
import * as yup from "yup";
import { User } from "../../entity/User";
import { formatYupErrors } from "../../utils/formatYupErrors";
import { createConfirmEmailLink } from "./createConfirmEmailLink";

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

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = User.create({
        email,
        password: hashedPassword
      });

      await user.save();

      await createConfirmEmailLink(url, user.id, redis);

      return null;
    }
  }
};
