import * as Schema from "./Schema";
import * as Validate from "./Validate";

/**
 * Creates a new account with an email and a password. Accounts may have any
 * string as their name even if another account has the same name. That name can
 * be updated at any time and is used for display purposes.
 */
export const signUp = Schema.createMutation({
  path: "/account/sign-up",
  input: {
    name: Validate.string,
    email: Validate.string,
    password: Validate.string,
  },
  output: {},
});

/**
 * Allows a user to sign in to their account with the password they selected
 * when creating their account.
 */
export const signIn = Schema.createMutation({
  path: "/account/sign-in",
  input: {
    email: Validate.string,
    password: Validate.string,
  },
  output: {},
});

/**
 * Allows a user to sign out of their account on their current device. To access
 * the private information associated with their account again the user must
 * sign back in.
 */
export const signOut = Schema.createMutation({
  path: "/account/sign-out",
  input: {},
  output: {},
});

export {
  MutationSchema,
  MutationSchemaData,
  MutationOperation,
  MutationOperationData,
} from "./Schema";

export {Validator, ValidatorValue, validateObject} from "./Validate";