import { IResolvers } from "graphql-tools";
import * as bcrypt from "bcrypt";
import * as yup from "yup";
//import { v4 } from "uuid";
import { User } from "../../entity/User";
import { formatYupErrors } from "../../utils/formatYupErrors";
import { userSessionIdPrefix } from "../../constants";
//import { sendEmail } from "../../utils/sendEmail";

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

const invalidLoginResponse = [
  {
    path: "login",
    message: "username or password invalid"
  }
];

export const resolvers: IResolvers = {
  Query: {
    dummy: () => "dummy"
  },
  Mutation: {
    login: async (
      _,
      args: GQL.ILoginOnMutationArguments,
      { session, redis, req }: any
    ) => {
      try {
        await schema.validate(args, { abortEarly: false });
      } catch (error) {
        return formatYupErrors(error);
      }

      const { email, password } = args;

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return invalidLoginResponse;
      }

      if (!user.confirmed) {
        return [
          {
            path: "login",
            message: "please confirm your email"
          }
        ];
      }

      if (user.forgotPasswordLocked) {
        return [
          {
            path: "login",
            message: "account is locked"
          }
        ];
      }

      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return invalidLoginResponse;
      }

      //login success
      session.userId = user.id;

      if (req.sessionID) {
        await redis.lpush(`${userSessionIdPrefix}${user.id}`, req.sessionID);
      }

      return null;
    }
  }
};
