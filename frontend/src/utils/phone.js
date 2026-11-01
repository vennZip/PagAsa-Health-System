export const PHILIPPINE_MOBILE_PATTERN = "09[0-9]{9}";

export const sanitizePhilippineMobile = (value) => (
  value.replace(/\D/g, "").slice(0, 11)
);
