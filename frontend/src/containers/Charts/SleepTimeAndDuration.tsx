import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";

export function SleepTimeAndDuration(props: ChartProps) {
  const { data } = useQuery(
    trpc.charts.sleep.listStartEndAndDuration.queryOptions({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
      aggregationPeriod: props.aggPeriod,
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};

    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: any[]) => {
          const date = new Date(params[0].value[0]).toDateString();

          const bedtime = params.find((p) => p.seriesName === "Bedtime")?.value[1];
          const wake = params.find((p) => p.seriesName === "Wake")?.value[1];

          const formatHour = (v: number) => {
            const h = reverseShift(v);
            const hour = Math.floor(h);
            const min = Math.round((h - hour) * 60);
            return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
          };

          const duration = wake - bedtime;

          return `
          <b>${date}</b><br/>
          Bedtime: ${formatHour(bedtime)}<br/>
          Wake: ${formatHour(wake)}<br/>
          Duration: ${duration.toFixed(2)}h<br/>
        `;
        },
      },

      legend: { top: 0 },

      xAxis: { type: "time" },

      yAxis: {
        type: "value",
        min: 18,
        max: 36,
        inverse: true,
        interval: 2,
        splitLine: { show: false },
        axisLabel: {
          formatter: (value: number) => {
            const h = value >= 24 ? value - 24 : value;
            const hour = Math.floor(h);
            return `${hour.toString().padStart(2, "0")}:00`;
          },
        },
      },
      series: [
        {
          name: "Bedtime",
          type: "line",
          smooth: true,
          symbol: "none",
          stack: "sleep-band",
          data: data.map((p) => [p.date, shiftHour(p.startHour)]),
          z: 3,
        },

        {
          name: "Duration",
          type: "line",
          smooth: true,
          symbol: "none",
          stack: "sleep-band",
          stackStrategy: "all",
          lineStyle: {
            opacity: 0,
          },
          areaStyle: {
            opacity: 0.25,
          },
          tooltip: {
            show: false,
          },
          data: data.map((p) => [p.date, p.duration]),
          z: 1,
        },

        {
          name: "Wake",
          type: "line",
          smooth: true,
          symbol: "none",
          data: data.map((p) => [p.date, shiftHour(p.endHour)]),
          z: 4,
        },
      ],
    };
  }, [data]);

  return <Echarts title={props.title} option={option} />;
}

function shiftHour(hour: number, anchor = 18) {
  return hour < anchor ? hour + 24 : hour;
}
function reverseShift(hour: number) {
  return hour >= 24 ? hour - 24 : hour;
}
