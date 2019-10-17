import { IResolvers } from "graphql-tools";
import * as yup from "yup";
import * as bcrypt from "bcrypt";
import { User } from "../../entity/User";
import { forgotPasswordLockAccount } from "../../utils/forgotPasswordLockAccount";
import { createForgotPasswordLink } from "./createForgotPasswordLink";
import { forgotPasswordPrefix } from "../../constants";
import { passwordValidation } from "../../yupSchemas";
import { formatYupErrors } from "../../utils/formatYupErrors";

const schema = yup.object().shape({
  newPassword: passwordValidation
});

export const resolvers: IResolvers = {
  Query: {
    dummy: () => "dummy"
  },
  Mutation: {
    sendForgotPasswordEmail: async (
      _,
      { email }: GQL.ISendForgotPasswordEmailOnMutationArguments,
      { redis }
    ) => {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return [
          {
            path: "email",
            message: "could not find user with that email"
          }
        ];
      }

      await forgotPasswordLockAccount(user.id, redis);
      // @todo add frontend url
      await createForgotPasswordLink("", user.id, redis);
      // @send email with url
      return true;
    },
    forgotPasswordChange: async (
      _,
      { newPassword, key }: GQL.IForgotPasswordChangeOnMutationArguments,
      { redis }
    ) => {
      const redisKey = `${forgotPasswordPrefix}${key}`;

      //Validate good key
      const userId = await redis.get(redisKey);
      if (!userId) {
        return [
          {
            path: "key",
            message: "key has expired"
          }
        ];
      }

      //Validate good password
      try {
        await schema.validate({ newPassword }, { abortEarly: false });
      } catch (error) {
        return formatYupErrors(error);
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      const updatePromise = User.update(
        { id: userId },
        {
          forgotPasswordLocked: false,
          password: hashedNewPassword
        }
      );

      const deleteRedisKeyPromise = redis.del(redisKey);

      await Promise.all([updatePromise, deleteRedisKeyPromise]);

      return null;
    }
  }
};
