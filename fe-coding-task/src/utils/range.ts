import type { IQuartersRange } from "../types/range";

export const formatQuartersRange = (range: IQuartersRange) =>
  Array.from(
    { length: range.end.year - range.start.year + 1 },
    (_, i) => range.start.year + i
  )
    .map((year) => {
      let quarters = Array.from({ length: 4 }, (_, i) => i + 1);

      if (year === range.start.year) {
        quarters = quarters.filter((quarter) => quarter >= range.start.quarter);
      }
      if (year === range.end.year) {
        quarters = quarters.filter((quarter) => quarter <= range.end.quarter);
      }

      return quarters.map((quarter) => `${year}K${quarter}`);
    })
    .flat();
