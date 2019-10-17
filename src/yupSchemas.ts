import * as yup from "yup";

export const passwordValidation = yup
  .string()
  .min(3)
  .max(255);
