import type { FC } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

interface IProps {
  labels: string[];
  data: number[];
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Chart: FC<IProps> = ({ labels, data }) => (
  <Bar
    data={{
      labels,
      datasets: [
        {
          label: "Price",
          data,
          backgroundColor: "#1976d2",
        },
      ],
    }}
  />
);

export default Chart;
