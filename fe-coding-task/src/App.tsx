import { useState, type FC } from "react";
import { Box, Divider } from "@mui/material";

import { HOUSE_TYPE, QUARTERS_RANGE_MIN_YEAR } from "./constants/form";
import Chart from "./components/Chart";
import Form from "./components/Form";

const App: FC = () => {
  const [statsResults, setStatsResults] = useState<{
    labels: string[];
    data: number[];
  } | null>(null);

  return (
    <Box p={4}>
      <Form
        onFetchedStats={setStatsResults}
        // Search params get/set
        defaultValues={{
          get: () => {
            const searchParams = new URLSearchParams(window.location.search);
            const houseType = searchParams.get("type");
            const startYear = parseInt(searchParams.get("startYear")!);
            const startQuarter = parseInt(searchParams.get("startQuarter")!);
            const endYear = parseInt(searchParams.get("endYear")!);
            const endQuarter = parseInt(searchParams.get("endQuarter")!);

            return {
              quartersRange: {
                start: {
                  year:
                    startYear && startYear >= QUARTERS_RANGE_MIN_YEAR
                      ? startYear
                      : QUARTERS_RANGE_MIN_YEAR,
                  quarter:
                    startQuarter && startQuarter >= 1 && startQuarter <= 4
                      ? startQuarter
                      : 1,
                },
                end: {
                  year:
                    endYear &&
                    endYear >= QUARTERS_RANGE_MIN_YEAR &&
                    endYear <= new Date().getFullYear()
                      ? endYear
                      : 2019,
                  quarter:
                    endQuarter && endQuarter >= 1 && endQuarter <= 4
                      ? endQuarter
                      : Math.ceil((new Date().getMonth() + 1) / 3),
                },
              },
              houseType:
                houseType && houseType in HOUSE_TYPE ? houseType : "00",
            };
          },
          set: ({ houseType, quartersRange }) => {
            window.history.pushState(
              null,
              "",
              window.location.pathname +
                "?" +
                new URLSearchParams({
                  type: houseType,
                  startYear: quartersRange.start.year.toString(),
                  startQuarter: quartersRange.start.quarter.toString(),
                  endYear: quartersRange.end.year.toString(),
                  endQuarter: quartersRange.end.quarter.toString(),
                }).toString()
            );
          },
        }}
      />

      {statsResults && (
        <Box maxWidth={768}>
          <Box my={2}>
            <Divider />
          </Box>
          <Chart labels={statsResults.labels} data={statsResults.data} />
        </Box>
      )}
    </Box>
  );
};

export default App;
