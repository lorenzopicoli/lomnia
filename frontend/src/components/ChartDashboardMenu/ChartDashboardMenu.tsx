import { ActionIcon, Flex, Group, Menu, Radio } from "@mantine/core";
import { DatePicker, type PickerBaseProps } from "@mantine/dates";
import { IconCalendar, IconCheck, IconSettings } from "@tabler/icons-react";
import { useState } from "react";
import { type Period, useDashboard } from "../../contexts/DashboardContext";

export function ChartDashboardMenu(props: {
  currentRange: [Date, Date];
  onDateChange: (range: [Date, Date]) => void;
  onPeriodSelected: (id: Period) => void;
  currentPeriod: Period | null;
  onNewChart: () => void;
  onRearrangeCharts: () => void;
}) {
  const [partialDateRange, setPartialDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const handleDateChange: PickerBaseProps<"range">["onChange"] = (dateStr) => {
    const dates: [Date | null, Date | null] = [
      dateStr[0] ? new Date(dateStr[0]) : null,
      dateStr[1] ? new Date(dateStr[1]) : null,
    ];
    setPartialDateRange(dates);
    if (dates[0] !== null && dates[1] !== null) {
      props.onDateChange(dates as [Date, Date]);
    }
  };
  const { isRearranging } = useDashboard();
  const handlePeriodChange = (id: string) => {
    switch (id) {
      case "week":
      case "month":
      case "year":
      case "all":
        props.onPeriodSelected(id);
        break;
    }
  };
  const handleRearrange = () => {
    props.onRearrangeCharts();
  };

  const PeriodPicker = () => {
    return (
      <Radio.Group onChange={handlePeriodChange}>
        <Group>
          <Radio checked={props.currentPeriod === "week"} label="Last week" value="week" />
          <Radio checked={props.currentPeriod === "month"} label="Last month" value="month" />
          <Radio checked={props.currentPeriod === "year"} label="Last year" value="year" />
          <Radio checked={props.currentPeriod === "all"} label="All" value="all" />
          <Menu.Target>
            <ActionIcon m={0} variant="transparent" size="lg">
              <IconCalendar />
            </ActionIcon>
          </Menu.Target>
        </Group>
      </Radio.Group>
    );
  };

  return (
    <Menu shadow="md" width={200}>
      <Flex justify={"flex-end"} direction={"row"} gap={"lg"}>
        <PeriodPicker />
        <ActionIcon m={0} variant="transparent" size="lg" onClick={handleRearrange}>
          {!isRearranging ? <IconSettings /> : <IconCheck />}
        </ActionIcon>
      </Flex>

      <Menu.Dropdown w={300}>
        <Flex justify={"space-between"} p={"md"} gap={"md"}>
          <DatePicker type="range" value={partialDateRange} onChange={handleDateChange} />
        </Flex>
      </Menu.Dropdown>
    </Menu>
  );
}
