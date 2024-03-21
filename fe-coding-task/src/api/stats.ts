import axios from "axios";

import type {
  IStatisticsReqPayload,
  IStatisticsResponsePayload,
} from "../types/api";

export const getPriceStats = (houseType: string[], quartersRange: string[]) =>
  axios.post<IStatisticsResponsePayload>(
    "https://data.ssb.no/api/v0/no/table/07241",
    {
      query: [
        {
          code: "Boligtype",
          selection: {
            filter: "item",
            values: houseType,
          },
        },
        {
          code: "Tid",
          selection: {
            filter: "item",
            values: quartersRange,
          },
        },
      ],
      response: {
        format: "json-stat2",
      },
    } as IStatisticsReqPayload
  );
