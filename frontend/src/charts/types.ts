import { ScaleTime, ScaleBand, ScaleLinear } from "@visx/vendor/d3-scale";

export type ChartScale = {
  scale: ScaleTime<number, number, never> | ScaleLinear<number, number, never> | ScaleBand<string | number | Date>;
  type: "linear" | "band" | "utc";
};

export type ChartScaleLinear = {
  scale: ScaleLinear<number, number, never>;
  type: "linear";
};

export type ChartScaleBand = {
  scale: ScaleBand<string | number | Date>;
  type: "band";
};

export type ChartScaleUtc = {
  scale: ScaleTime<number, number, never>;
  type: "utc";
};

export function isScaleLinear(s: ChartScale): s is { type: "linear"; scale: ScaleLinear<number, number, never> } {
  return s.type === "linear";
}

export function isScaleBand(s: ChartScale): s is { type: "band"; scale: ScaleBand<string | number | Date> } {
  return s.type === "band";
}

export function isScaleUtc(s: ChartScale): s is { type: "utc"; scale: ScaleTime<number, number, never> } {
  return s.type === "utc";
}
