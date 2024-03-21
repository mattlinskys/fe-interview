export interface IStatisticsReqPayload {
  query: [
    {
      code: "Boligtype";
      selection: {
        filter: "item";
        values: string[];
      };
    },
    {
      code: "Tid";
      selection: {
        filter: "item";
        values: string[];
      };
    }
  ];
  response: {
    format: "json-stat2";
  };
}

export interface IStatisticsResponsePayload {
  value: number[];
}
