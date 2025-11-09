export const formatToBrazilianDate = (value: string): string => {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year.slice(-2)}`;
};