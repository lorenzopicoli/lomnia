import { useHover } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconCopy, IconDownload, IconX } from "@tabler/icons-react";
import ReactECharts, { type EChartsReactProps } from "echarts-for-react";
import { useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";

function tablerToEchartsIcon(Icon: React.ComponentType<any>): string {
  const svg = renderToStaticMarkup(<Icon size={24} stroke={1.5} />);
  const paths = [...svg.matchAll(/d="([^"]+)"/g)].map((m) => m[1]).join(" ");
  return `path://${paths}`;
}

const ICON_COPY = tablerToEchartsIcon(IconCopy);
const ICON_DOWNLOAD = tablerToEchartsIcon(IconDownload);

export function Echarts(props: EChartsReactProps & { title?: string }) {
  const { ref, hovered } = useHover();
  const chartRef = useRef<any>(null);

  const saveAsImage = {
    type: "png",
    name: props.title ?? "lomnia-chart",
    backgroundColor: "#000",
    icon: ICON_DOWNLOAD,
    title: "Save as image",
  };

  const option = {
    ...props.option,
    toolbox: {
      show: hovered,
      iconStyle: { borderColor: "#909296" },
      emphasis: { iconStyle: { borderColor: "#fff" } },
      feature: {
        saveAsImage,
        myTool_copyOptions: {
          title: "Copy chart options",
          icon: ICON_COPY,
          onclick: () => {
            const optionToSave = {
              title: { text: props.title },
              ...props.option,
              toolbox: {
                show: true,
                feature: {
                  saveAsImage,
                },
              },
            };
            navigator.clipboard
              .writeText(JSON.stringify(optionToSave, null, 2))
              .then(() =>
                notifications.show({
                  title: "Copied!",
                  message: "Chart options copied to clipboard",
                  color: "green",
                  icon: <IconCheck size={16} />,
                }),
              )
              .catch(() =>
                notifications.show({
                  title: "Failed",
                  message: "Could not copy to clipboard",
                  color: "red",
                  icon: <IconX size={16} />,
                }),
              );
          },
        },
      },
    },
  };

  return (
    <div ref={ref} style={{ height: "100%", width: "100%" }}>
      <ReactECharts
        ref={chartRef}
        theme="default_dark"
        style={{ height: "100%", width: "100%" }}
        notMerge
        lazyUpdate
        {...props}
        option={option}
      />
    </div>
  );
}
