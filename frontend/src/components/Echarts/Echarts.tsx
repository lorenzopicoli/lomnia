import ReactECharts, { type EChartsReactProps } from "echarts-for-react";

export function Echarts(props: EChartsReactProps) {
  return (
    <ReactECharts
      theme={"default_dark"}
      style={{ height: "100%" }}
      option={option}
      notMerge={true}
      lazyUpdate={true}
      {...props}
    />
  );
}
