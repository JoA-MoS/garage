import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

export function getReservationMonths(dates: Date[]) {
  return [
    ...new Set(dates.map((d) => dayjs.utc(d).startOf('month').format())),
  ].map((v) => new Date(v));
}

export function datesFromRange(startDate: Date, endDate: Date): Date[] {
  const dateArray = [];
  let curDate = startDate;
  while (curDate <= endDate) {
    dateArray.push(curDate);
    curDate = dayjs(curDate).add(1, 'day').toDate();
  }
  return dateArray;
}

export function getWeekends(startDate: Date, endDate: Date): Date[] {
  const dateArray = [];
  let curDate = startDate;
  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    console.log({ curDate, dayOfWeek });
    if (dayOfWeek === 6) {
      dateArray.push(curDate);
      dateArray.push(dayjs(curDate).add(1, 'day').toDate());
      curDate = dayjs(curDate).add(7, 'day').toDate();
    } else {
      curDate = dayjs(curDate).add(1, 'day').toDate();
    }
  }
  return dateArray;
}
