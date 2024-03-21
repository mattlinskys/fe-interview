import type { FC } from "react";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { HOUSE_TYPE, QUARTERS_RANGE_MIN_YEAR } from "../constants/form";
import { getPriceStats } from "../api/stats";
import { formatQuartersRange } from "../utils/range";
import QuartersRangeSelector from "./QuartersRangeSelector";
import type { IQuartersRange } from "../types/range";

export interface IFormValues {
  quartersRange: IQuartersRange;
  houseType: string;
}

interface IProps {
  onFetchedStats: (stats: { labels: string[]; data: number[] }) => void;
  defaultValues: {
    get: () => IFormValues;
    set: (values: IFormValues) => void;
  };
}

const Form: FC<IProps> = ({ onFetchedStats, defaultValues }) => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<IFormValues>({
    defaultValues: defaultValues.get(),
  });

  const onSubmit: SubmitHandler<IFormValues> = async (values) => {
    const { houseType, quartersRange } = values;
    try {
      const quartersRangeFormatted = formatQuartersRange(quartersRange);

      const {
        data: { value: data },
      } = await getPriceStats([houseType], quartersRangeFormatted);

      onFetchedStats({
        labels: quartersRangeFormatted,
        data: data.slice(0, data.length / 2),
      });

      defaultValues.set(values);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2} maxWidth={578}>
        <FormControl fullWidth>
          <InputLabel id="house-type">House type</InputLabel>

          <Controller
            control={control}
            name="houseType"
            render={({ field: { value, onChange } }) => (
              <Select id="house-type" onChange={onChange} value={value}>
                {Object.entries(HOUSE_TYPE).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </FormControl>

        <Controller
          control={control}
          name="quartersRange"
          render={({ field: { value, onChange } }) => (
            <QuartersRangeSelector
              minYear={QUARTERS_RANGE_MIN_YEAR}
              maxYear={new Date().getFullYear()}
              value={value}
              onChange={onChange}
            />
          )}
        />

        <Button type="submit" variant="contained" disabled={isSubmitting}>
          Search
        </Button>
      </Stack>
    </form>
  );
};

export default Form;
