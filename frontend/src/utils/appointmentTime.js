export const isFutureAppointment = (date, time, now = Date.now()) => {
  if (!date || !time) return false;
  return new Date(`${date}T${time}:00+08:00`).getTime() > Number(now);
};
