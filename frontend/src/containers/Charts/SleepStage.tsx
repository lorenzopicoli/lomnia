import { TZDate } from "@date-fns/tz";
import { useMemo } from "react";
import { Echarts } from "../../components/Echarts/Echarts";

// IMPORTANT: make sure this is registered somewhere once
// echarts.use(stageCustomSeriesInstaller);

type SleepStage = "awake" | "light" | "deep" | "rem" | "unmeasurable";

export function SleepStage(props: {
  stages: {
    startedAt: string;
    endedAt: string;
    stage: SleepStage;
  }[];
  timezone: string;
}) {
  const option = useMemo(() => {
    const { stages, timezone } = props;
    if (!stages?.length) return {};

    const STAGE_LABELS: Record<SleepStage, string> = {
      deep: "Deep",
      light: "Light",
      rem: "REM",
      awake: "Awake",
      unmeasurable: "Unknown",
    };

    const data = stages.map((s) => [
      new TZDate(s.startedAt, timezone),
      new TZDate(s.endedAt, timezone),
      STAGE_LABELS[s.stage],
    ]);

    return {
      tooltip: {
        trigger: "item",
      },
      xAxis: {
        type: "time",
        min: (value) => {
          // Max whole hour that is no biggeer than value
          return Math.floor(value.min / (60 * 60 * 1000)) * 60 * 60 * 1000;
        },
        max: (value) => {
          // Min whole hour that is no smaller than value
          return Math.ceil(value.max / (60 * 60 * 1000)) * 60 * 60 * 1000;
        },
        axisLabel: {
          align: "left",
          color: "#c6c6c6",
        },
      },
      yAxis: {
        type: "category",
        data: ["Deep", "Light", "REM", "Awake"],
        splitLine: {
          show: true,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            color: "#ccc",
          },
        },
      },

      dataset: {
        source: data,
      },
      series: {
        type: "custom",
        renderItem: "stage",
        colorBy: "data",
        itemPayload: {
          envelope: {},
        },
        encode: {
          x: [0, 1],
          y: 2,
          tooltip: [0, 1],
        },
      },
      visualMap: {
        show: false,
        type: "piecewise",
        categories: [0, 1, 2, 3],
        dimension: 2,
        inRange: {
          color: {
            0: "#35349D",
            1: "#3478F6",
            2: "#59AAE1",
            3: "#EF8872",
          },
        },
        seriesIndex: 0,
        outOfRange: {
          color: "#61E6E1",
        },
      },
    };
  }, [props]);

  return <Echarts option={option} />;
}
