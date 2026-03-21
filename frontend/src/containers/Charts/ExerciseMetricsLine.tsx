import { TZDate } from "@date-fns/tz";
import { alpha } from "@mantine/core";
import { intervalToDuration } from "date-fns";
import { useMemo } from "react";
import type { RouterOutputs } from "../../api/trpc";
import { Echarts } from "../../components/Echarts/Echarts";
import { useConfig } from "../../contexts/ConfigContext";
import { formatDurationShort } from "../../utils/formatDurationShort";
import { EchartsCommonConfig } from "./EchartsCommonConfig";

type ExerciseMetrics = NonNullable<Required<RouterOutputs["exercise"]["getById"]["metrics"]>>[number];

type MetricKey = {
  key: keyof ExerciseMetrics;
  format?: (value: number) => string;
};

export function ExerciseMetricsLine(props: {
  metrics: ExerciseMetrics[];
  metric: MetricKey;
  exerciseStartTime: TZDate;
}) {
  const { theme } = useConfig();

  const option = useMemo(() => {
    const { metrics, metric, exerciseStartTime } = props;

    if (!metrics?.length) return {};

    const start = new TZDate(exerciseStartTime, metrics[0].timezone || "UTC").getTime();
    const data = metrics.map((entry) => {
      const value = entry[metric.key];
      if (value == null) return null;
      const current = new TZDate(entry.recordedAt, entry.timezone || "UTC").getTime();
      const elapsedSeconds = (current - start) / 1000;
      if (elapsedSeconds < 0) return null;

      return [elapsedSeconds, value] as [number, number];
    }) as [number, number][];

    return {
      xAxis: {
        type: "value",
        name: "Time",
        axisLabel: {
          formatter: (x: number) => formatDurationShort(intervalToDuration({ start: 0, end: x * 1000 })),
        },
        min: "dataMin",
        max: "dataMax",
      },
      yAxis: {
        axisLabel: {
          formatter: (value: number) => (metric.format ? metric.format(value) : value),
        },
        min: "dataMin",
        max: "dataMax",
      },
      tooltip: {
        trigger: "axis",
        formatter: EchartsCommonConfig.dateNumberSeriesFormatter<number, number>(
          [metric.key],
          (x) => formatDurationShort(intervalToDuration({ start: 0, end: x * 1000 })),
          (y) => `<b>${metric.format ? metric.format(y) : y}</b>`,
        ),
      },
      series: [
        {
          name: metric.key,
          type: "line",
          data,
          showSymbol: false,
          smooth: true,
          connectNulls: false,
          lineStyle: {
            color: theme.colors.violet[5],
            width: 2,
          },
          itemStyle: {
            color: "#ef4444",
          },
          areaStyle: {
            color: alpha(theme.colors.violet[5], 0.15),
          },
        },
      ],
    };
  }, [props, theme.colors.violet[5]]);

  return <Echarts option={option} />;
}
