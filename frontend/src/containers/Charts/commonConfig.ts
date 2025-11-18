import type { CallbackDataParams } from "echarts/types/dist/shared";

export namespace EchartsCommonConfig {
  export const roundedBar = {
    borderRadius: [4, 4, 0, 0],
  };

  export const colors = {
    rain: "#4A90E2",

    snow: "#BBD4F1",
  };

  export const colorSteps = {
    rain: ["#205799", "#1464C4", "#0771F2", "#00B2FF"],
  };

  export function dateNumberSeriesFormatter<XValue, YValue>(
    seriesNames: string[],
    formatXValue: (x: XValue) => string,
    formatYValue: (y: YValue, seriesName: string) => string,
    formatExtra?: (x: XValue, ys: YValue[]) => string,
  ) {
    return (_params: CallbackDataParams | CallbackDataParams[]) => {
      const params = Array.isArray(_params) ? _params : [_params];
      const series = params.filter((p) => seriesNames.includes(p.seriesName ?? ""));
      if (!series[0]) {
        console.log("No series matched for tooltip");
        return "";
      }

      const typeValue = (v: unknown) => v as unknown as [XValue, YValue];

      const typed = typeValue(series[0].value);
      const formattedX = formatXValue(typed[0]);

      return `
            <div>
              <strong>${formattedX}</strong><br/>
              ${series
                .map((param) => {
                  const typedValue = typeValue(param.value);
                  const formattedY = formatYValue(typedValue[1], param.seriesName ?? "");
                  if (formattedY !== "") {
                    return `${formattedY}<br/>`;
                  }
                  return "";
                })
                .join("")}
              ${
                formatExtra
                  ? formatExtra(
                      typed[0],
                      series.map((p) => typeValue(p.value)[1]),
                    )
                  : ""
              }
            </div>
          `;
    };
  }
}
