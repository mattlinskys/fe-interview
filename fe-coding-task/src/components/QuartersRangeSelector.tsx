import { useLayoutEffect, type FC } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";

import type { IQuartersRange } from "../types/range";

export interface IProps {
  minYear: number;
  maxYear: number;
  value: IQuartersRange;
  onChange: (value: IProps["value"]) => void;
}

const QuartersRangeSelector: FC<IProps> = ({
  minYear,
  maxYear,
  value: { start, end },
  onChange,
}) => {
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i
  );
  const quarters = Array.from({ length: 4 }, (_, i) => i + 1);

  // Update the start date if it's after the end date
  useLayoutEffect(() => {
    if (
      start.year > end.year ||
      (start.year === end.year && start.quarter > end.quarter)
    ) {
      onChange({ start: { year: end.year, quarter: end.quarter }, end });
    }
  }, [start, end, onChange]);

  // Update the end date if it's before the start date
  useLayoutEffect(() => {
    if (
      start.year > end.year ||
      (start.year === end.year && start.quarter > end.quarter)
    ) {
      onChange({ start, end: { year: start.year, quarter: start.quarter } });
    }
  }, [start, end, onChange]);

  return (
    <Stack direction="row" spacing={2} alignItems="stretch">
      <FormControl>
        <InputLabel>Start Year</InputLabel>
        <Select
          value={start.year}
          onChange={(e) =>
            onChange({
              start: {
                year: parseInt(e.target.value as string),
                quarter: start.quarter,
              },
              end,
            })
          }
        >
          {years
            .filter((year) => year <= end.year)
            .map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      <FormControl>
        <InputLabel>Start Quarter</InputLabel>
        <Select
          value={start.quarter}
          onChange={(e) =>
            onChange({
              start: {
                year: start.year,
                quarter: parseInt(e.target.value as string),
              },
              end,
            })
          }
        >
          {quarters.map((quarter) => (
            <MenuItem key={quarter} value={quarter}>
              Q{quarter}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <InputLabel>End Year</InputLabel>
        <Select
          value={end.year}
          onChange={(e) =>
            onChange({
              start,
              end: {
                year: parseInt(e.target.value as string),
                quarter: end.quarter,
              },
            })
          }
        >
          {years
            .filter((year) => year >= start.year)
            .map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      <FormControl>
        <InputLabel>End Quarter</InputLabel>
        <Select
          value={end.quarter}
          onChange={(e) =>
            onChange({
              start,
              end: {
                year: end.year,
                quarter: parseInt(e.target.value as string),
              },
            })
          }
        >
          {quarters.map((quarter) => (
            <MenuItem key={quarter} value={quarter}>
              Q{quarter}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};

export default QuartersRangeSelector;
