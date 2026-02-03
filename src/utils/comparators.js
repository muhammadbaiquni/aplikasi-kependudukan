import dayjs from 'dayjs';

export const compareString = (left, right) => (left ?? '').toString().localeCompare(
  (right ?? '').toString()
);

export const compareNumber = (left, right) => (left ?? 0) - (right ?? 0);

export const compareDate = (left, right) => {
  const leftDate = dayjs(left);
  const rightDate = dayjs(right);
  if (!leftDate.isValid() && !rightDate.isValid()) {
    return 0;
  }
  if (!leftDate.isValid()) {
    return 1;
  }
  if (!rightDate.isValid()) {
    return -1;
  }
  return leftDate.valueOf() - rightDate.valueOf();
};
