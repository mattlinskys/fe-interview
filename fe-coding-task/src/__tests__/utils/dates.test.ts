import { formatQuartersRange } from "../../utils/range";

test("Format quarters range to API format", () => {
  expect(
    formatQuartersRange({
      start: { year: 2010, quarter: 2 },
      end: { year: 2010, quarter: 3 },
    })
  ).toStrictEqual(["2010K2", "2010K3"]);

  expect(
    formatQuartersRange({
      start: { year: 2015, quarter: 1 },
      end: { year: 2016, quarter: 3 },
    })
  ).toStrictEqual([
    "2015K1",
    "2015K2",
    "2015K3",
    "2015K4",
    "2016K1",
    "2016K2",
    "2016K3",
  ]);
});
