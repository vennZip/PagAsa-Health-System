const manilaFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export const getManilaDateKey = (value = new Date()) => {
  const parts = Object.fromEntries(
    manilaFormatter.formatToParts(new Date(value))
      .filter(({ type }) => type !== "literal")
      .map(({ type, value: partValue }) => [type, partValue])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const shiftDateKey = (dateKey, days) => {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const getDateRange = (preset, customFrom = "", customTo = "") => {
  const today = getManilaDateKey();
  const ranges = {
    today: { from: today, to: today, label: "Today" },
    yesterday: { from: shiftDateKey(today, -1), to: shiftDateKey(today, -1), label: "Yesterday" },
    last7: { from: shiftDateKey(today, -6), to: today, label: "Last 7 days" },
    last30: { from: shiftDateKey(today, -29), to: today, label: "Last 30 days" },
    all: { from: "", to: "", label: "All available dates" }
  };
  if (preset === "custom") {
    return { from: customFrom, to: customTo, label: `${customFrom || "Beginning"} to ${customTo || "Present"}` };
  }
  return ranges[preset] || ranges.all;
};

export const isDateWithinRange = (value, range) => {
  if (!value) return false;
  const dateKey = getManilaDateKey(value);
  return (!range.from || dateKey >= range.from) && (!range.to || dateKey <= range.to);
};
