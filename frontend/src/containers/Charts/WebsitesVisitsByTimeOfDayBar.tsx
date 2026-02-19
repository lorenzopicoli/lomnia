import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";
import { isNumber } from "../../utils/isNumber";

export function WebsitesVisitsByTimeOfDayBar(props: ChartProps) {
  const { data } = useQuery(
    trpc.charts.browserHistory.getVisitsByHourOfDay.queryOptions({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};

    // Ensure all hours exist (0–23), even if visits = 0
    const visitsByHour = Array.from({ length: 24 }, (_, hour) => {
      const entry = data.find((d) => d.hour === hour);
      return {
        hour,
        visits: entry?.visits ?? 0,
      };
    });

    return {
      tooltip: {
        trigger: "axis",
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        formatter: (params: any) => {
          const { name, value } = params[0];
          return `${name}: ${isNumber(value) ? value : 0} visits`;
        },
      },

      xAxis: {
        type: "category",
        data: visitsByHour.map((d) => `${String(d.hour).padStart(2, "0")}:00`),
        name: "Hour of day",
      },

      yAxis: {
        type: "value",
        name: "Visits",
        minInterval: 1,
      },

      series: [
        {
          type: "bar",
          name: "Visits",
          data: visitsByHour.map((d) => d.visits),
          colorBy: "data",
        },
      ],
    };
  }, [data]);

  return <Echarts title={props.title} option={option} />;
}
