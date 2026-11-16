// Clinic appointments always use Philippine time, regardless of server timezone.
export const appointmentInstant = (date, time) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || "")) return null;
  const day = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== date) return null;
  return new Date(`${date}T${time}:00+08:00`);
};

export const isFutureAppointment = (date, time, now = new Date()) => {
  const instant = appointmentInstant(date, time);
  return instant !== null && instant.getTime() > now.getTime();
};
