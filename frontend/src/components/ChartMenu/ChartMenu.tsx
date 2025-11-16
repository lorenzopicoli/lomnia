import { Button, Flex, Menu, Pill } from "@mantine/core";
import { DatePicker, type PickerBaseProps } from "@mantine/dates";
import { format } from "date-fns/format";
import { subHours } from "date-fns/subHours";
import { subMonths } from "date-fns/subMonths";
import { subWeeks } from "date-fns/subWeeks";
import { subYears } from "date-fns/subYears";
import { useEffect, useState } from "react";
import type { ChartAreaConfig } from "../../charts/types";

export function ChartMenu(props: {
  selectedCharts: ChartAreaConfig[];
  currentRange: [Date, Date];
  onDateChange: (range: [Date, Date]) => void;
  onRemoveChart: (chartId: string) => void;
  onNewChart: () => void;
}) {
  const [partialDateRange, setPartialDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const handleDateChange: PickerBaseProps<"range">["onChange"] = (dateStr) => {
    const dates: [Date | null, Date | null] = [
      dateStr[0] ? new Date(dateStr[0]) : null,
      dateStr[1] ? new Date(dateStr[1]) : null,
    ];
    setPartialDateRange(dates);
  };
  const handleQuickDatesClick = (id: "week" | "24h" | "month" | "year" | "all") => {
    let range: [Date, Date];
    switch (id) {
      case "week":
        range = [subWeeks(new Date(), 1), new Date()];
        break;
      case "month":
        range = [subMonths(new Date(), 1), new Date()];
        break;
      case "year":
        range = [subYears(new Date(), 1), new Date()];
        break;
      case "24h":
        range = [subHours(new Date(), 24), new Date()];
        break;
      case "all":
        range = [subYears(new Date(), 100), new Date()];
        break;
    }
    setPartialDateRange(range);
  };
  const handleRemove = (chart: ChartAreaConfig) => () => {
    props.onRemoveChart(chart.uniqueId);
  };
  useEffect(() => {
    if (partialDateRange[0] && partialDateRange[1]) {
      props.onDateChange(partialDateRange as [Date, Date]);
    }
  }, [props, partialDateRange]);
  return (
    <Menu shadow="md" width={200}>
      <Flex direction={"row"}>
        <Button onClick={props.onNewChart} variant={"subtle"}>
          Add chart
        </Button>
        <Menu.Target>
          <Button variant="subtle">
            {format(props.currentRange[0], "MMMM do, yyyy HH:mm")} to{" "}
            {format(props.currentRange[1], "MMMM do, yyyy HH:mm")}
          </Button>
        </Menu.Target>
        <Pill.Group>
          {props.selectedCharts.map((v) => (
            <Pill key={v.id} variant="default" withRemoveButton onRemove={handleRemove(v)}>
              {v.title}
            </Pill>
          ))}
        </Pill.Group>
      </Flex>

      <Menu.Dropdown w={460}>
        <Flex justify={"space-between"} p={"md"} gap={"md"}>
          <div>
            <Menu.Item onClick={() => handleQuickDatesClick("24h")}>Past 24 hours</Menu.Item>
            <Menu.Item onClick={() => handleQuickDatesClick("week")}>Past week</Menu.Item>
            <Menu.Item onClick={() => handleQuickDatesClick("month")}>Past month</Menu.Item>
            <Menu.Item onClick={() => handleQuickDatesClick("year")}>Past year</Menu.Item>
            <Menu.Item onClick={() => handleQuickDatesClick("all")} color="red">
              All
            </Menu.Item>
          </div>
          <DatePicker type="range" value={partialDateRange} onChange={handleDateChange} />
        </Flex>
      </Menu.Dropdown>
    </Menu>
  );
}
