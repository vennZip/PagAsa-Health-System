// Keep this policy aligned with the client; parity is checked by passwordPolicy.test.js.
export const PASSWORD_POLICY_MESSAGE = "Use 6–10 characters with at least one uppercase letter, one lowercase letter, one number, and one special character.";
export const isValidPassword = (password) => typeof password === "string"
  && password.length >= 6 && password.length <= 10
  && /[A-Z]/.test(password) && /[a-z]/.test(password)
  && /[0-9]/.test(password) && /[\p{P}\p{S}]/u.test(password);
