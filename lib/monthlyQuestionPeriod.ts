export const monthlyQuestionMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function formatMonthlyQuestionPeriod(
  month: number | null | undefined,
  year: number | null | undefined
) {
  if (
    !Number.isInteger(month) ||
    !Number.isInteger(year) ||
    !month ||
    month < 1 ||
    month > 12 ||
    !year
  ) {
    return "";
  }

  return `${monthlyQuestionMonths[month - 1]} ${year}`;
}

export function parseMonthlyQuestionPeriod(
  month: unknown,
  year: unknown,
  options: { required: boolean }
) {
  const parsedMonth =
    month === null || month === undefined || month === ""
      ? null
      : Number(month);
  const parsedYear =
    year === null || year === undefined || year === ""
      ? null
      : Number(year);

  if (parsedMonth === null && parsedYear === null && !options.required) {
    return { month: null, year: null };
  }
  if (parsedMonth === null || parsedYear === null) {
    throw new Error("Choose both a Month and Year.");
  }
  if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    throw new Error("Choose a valid Month.");
  }
  if (!Number.isInteger(parsedYear) || parsedYear < 2020 || parsedYear > 2100) {
    throw new Error("Choose a valid Year between 2020 and 2100.");
  }

  return { month: parsedMonth, year: parsedYear };
}
