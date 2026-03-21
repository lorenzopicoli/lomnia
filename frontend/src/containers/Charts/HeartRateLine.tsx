import { TZDate } from "@date-fns/tz";
import { intervalToDuration } from "date-fns";
import { useMemo } from "react";
import { Echarts } from "../../components/Echarts/Echarts";
import { formatDurationShort } from "../../utils/formatDurationShort";
import { formatHeartRate } from "../../utils/formatHeartRate";
import { EchartsCommonConfig } from "./EchartsCommonConfig";

export function HeartRateLine(props: { data: { date: string; heartRate: number }[]; startTime: TZDate }) {
  const option = useMemo(() => {
    const { data: rawData, startTime } = props;

    if (!rawData?.length) return {};

    const start = new TZDate(startTime).getTime();

    const data = rawData
      .map((entry) => {
        if (entry.heartRate == null) return null;

        const current = new TZDate(entry.date).getTime();
        const elapsedSeconds = (current - start) / 1000;
        if (elapsedSeconds < 0) return null;

        return [elapsedSeconds, entry.heartRate] as [number, number];
      })
      .filter(Boolean) as [number, number][];

    return {
      xAxis: {
        type: "value",
        axisLabel: {
          formatter: (x: number) =>
            formatDurationShort(intervalToDuration({ start: 0, end: x * 1000 }), { skipSeconds: true }),
        },
        min: "dataMin",
        max: "dataMax",
      },
      yAxis: {
        axisLabel: {
          formatter: (value: number) => formatHeartRate(value),
        },
        min: "dataMin",
        max: "dataMax",
      },
      tooltip: {
        trigger: "axis",
        formatter: EchartsCommonConfig.dateNumberSeriesFormatter<number, number>(
          ["Heart Rate"],
          (x) => formatDurationShort(intervalToDuration({ start: 0, end: x * 1000 })),
          (y) => `<b>${formatHeartRate(y)}</b>`,
        ),
      },
      series: [
        {
          name: "Heart Rate",
          type: "line",
          data,
          showSymbol: false,
          smooth: true,

          connectNulls: false,
          lineStyle: {
            color: "#ef4444",
            width: 2,
          },
          itemStyle: {
            color: "#ef4444",
          },
          areaStyle: {
            color: "rgba(239, 68, 68, 0.15)",
          },
        },
      ],
    };
  }, [props]);

  return <Echarts option={option} />;
}
