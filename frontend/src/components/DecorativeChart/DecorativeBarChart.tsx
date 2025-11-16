import { useMantineTheme } from "@mantine/core";
import { ParentSize } from "@visx/responsive";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";

export function DecorativeBarChartInternal(props: { height: number; width: number }) {
  const { height, width } = props;
  const theme = useMantineTheme();
  const data = [
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 4 },
    { x: 4, y: 2 },
  ];

  const xScale = scaleBand({
    domain: data.map((d) => d.x),
    range: [0, width],
    padding: 0.2,
  });

  const yScale = scaleLinear({
    domain: [0, Math.max(...data.map((d) => d.y + 1))],
    range: [height, 0],
  });

  return (
    <svg width={width} height={height}>
      {data.map((barData) => {
        const barWidth = xScale.bandwidth();
        const barHeight = height - yScale(barData.y ?? 0);
        const barX = xScale(barData.x);
        const barY = height - barHeight;
        return (
          <>
            <Bar
              key={"bar" + barData.x}
              x={barX}
              y={barY}
              width={barWidth}
              height={barHeight}
              fill={theme.colors.pink[4]}
            />
          </>
        );
      })}
    </svg>
  );
}

export function DecorativeBarChart() {
  return (
    <ParentSize debounceTime={10}>
      {({ width, height }) => (
        <div style={{ width: "100%", height: "100%" }}>
          <DecorativeBarChartInternal
            //    {...props}
            height={height}
            width={width}
          />
        </div>
      )}
    </ParentSize>
  );
}
