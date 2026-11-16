export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 10;
export const PASSWORD_POLICY_MESSAGE = "Use 6–10 characters with at least one uppercase letter, one lowercase letter, one number, and one special character.";

export const getPasswordRequirements = (password = "") => [
  { id: "length", label: "6–10 characters", met: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH },
  { id: "uppercase", label: "At least one uppercase letter (A–Z)", met: /[A-Z]/.test(password) },
  { id: "lowercase", label: "At least one lowercase letter (a–z)", met: /[a-z]/.test(password) },
  { id: "number", label: "At least one number (0–9)", met: /[0-9]/.test(password) },
  { id: "special", label: "At least one special character (e.g. ! @ # $)", met: /[\p{P}\p{S}]/u.test(password) }
];

export const isValidPassword = (password) => typeof password === "string" && getPasswordRequirements(password).every(({ met }) => met);
