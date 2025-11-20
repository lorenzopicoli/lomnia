import ReactECharts, { type EChartsReactProps } from "echarts-for-react";

export function Echarts(props: EChartsReactProps) {
  return (
    <ReactECharts
      theme={"default_dark"}
      style={{ height: "100%", width: "100%" }}
      notMerge={true}
      lazyUpdate={true}
      {...props}
    />
  );
}
