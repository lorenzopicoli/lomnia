import { useMantineTheme } from "@mantine/core";
import { curveLinear } from "@visx/curve";
import { ParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { Area } from "@visx/shape";

export function DecorativeAreaChartInternal(props: { height: number; width: number }) {
  const { height, width } = props;
  const theme = useMantineTheme();
  const data = [
    { x: 0, y: 0 },
    { x: 2, y: 2 },
    { x: 4, y: 1 },
    { x: 6, y: 4 },
    { x: 8, y: 2 },
    { x: 10, y: 4 },
    { x: 12, y: 1 },
    { x: 14, y: 3 },
  ];

  const xScale = scaleLinear({
    domain: [0, Math.max(...data.map((d) => d.x + 1))],
    range: [0, width],
  });

  const yScale = scaleLinear({
    domain: [0, Math.max(...data.map((d) => d.y + 1))],
    range: [height, 0],
  });

  return (
    <svg width={width} height={height}>
      <Area
        data={data}
        x={(datum) => xScale(datum.x) ?? 0}
        y={(datum) => yScale(datum.y) ?? 0}
        y1={height}
        curve={curveLinear}
        fill={theme.colors.teal[2]}
        stroke={theme.colors.teal[6]}
      />
    </svg>
  );
}

export function DecorativeAreaChart() {
  return (
    <ParentSize debounceTime={10}>
      {({ width, height }) => (
        <div style={{ width: "100%", height: "100%" }}>
          <DecorativeAreaChartInternal
            //    {...props}
            height={height}
            width={width}
          />
        </div>
      )}
    </ParentSize>
  );
}
