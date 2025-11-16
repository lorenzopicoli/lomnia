import { useQuery } from "@tanstack/react-query";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";

export function PrecipitationExperienced(props: { startDate: Date; endDate: Date }) {
  const { data: precipitationData } = useQuery(
    trpc.getWeatherPrecipitation.queryOptions({
      startDate: props.startDate.toISOString(),
      endDate: props.endDate.toISOString(),
      period: "day",
    }),
  );

  const option = useMemo(() => {
    if (!precipitationData) return {};

    const dates = precipitationData.map((p) => new Date(p.date));
    const rain = precipitationData.map((p) => p.rainSum);
    const snow = precipitationData.map((p) => p.snowfallSum);

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter(params: any) {
          const rain = params.find((p: any) => p.seriesName === "Rain")?.value[1] ?? 0;
          const snow = params.find((p: any) => p.seriesName === "Snow")?.value[1] ?? 0;
          const total = rain + snow;

          return `
          <div>
            <strong>${new Date(params[0].value[0]).toDateString()}</strong><br/>
            Rain: ${rain.toFixed(1)} mm<br/>
            Snow: ${snow.toFixed(1)} mm<br/>
            <b>Total: ${total.toFixed(1)} mm</b>
          </div>
        `;
        },
      },

      legend: { top: 0 },

      grid: [{ top: 40, bottom: 0, left: 0, right: 0 }],

      xAxis: [{ type: "time", gridIndex: 0 }],

      yAxis: [
        {
          type: "value",
          name: "Precipitation (mm)",
        },
      ],

      series: [
        {
          name: "Rain",
          type: "bar",
          stack: "precip",
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: dates.map((d, i) => [d, rain[i]]),
          barMaxWidth: 22,
        },
        {
          name: "Snow",
          type: "bar",
          stack: "precip",
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: dates.map((d, i) => [d, snow[i]]),
          barMaxWidth: 22,
        },
      ],
    };
  }, [precipitationData]);

  return <ReactECharts style={{ height: "100%", width: "100%" }} option={option} notMerge lazyUpdate />;
}
