export const calculateDaysInOneMonth = (startDate = new Date()): number => {
  const start = new Date(startDate);
  const end = new Date(startDate);
  end.setMonth(end.getMonth() + 1);

  const msInDay = 1000 * 60 * 60 * 24;
  const days = Math.round((end.getTime() - start.getTime()) / msInDay);

  return days;
};
