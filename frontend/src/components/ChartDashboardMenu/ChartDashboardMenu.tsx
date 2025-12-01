import { ActionIcon, Breadcrumbs, Flex, Group, Menu, Radio } from "@mantine/core";
import { DatePicker, type PickerBaseProps } from "@mantine/dates";
import { IconCalendar, IconCheck, IconPlus, IconSettings } from "@tabler/icons-react";
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
  const { onNewChart, onDateChange, onPeriodSelected, onRearrangeCharts, currentPeriod } = props;
  const [partialDateRange, setPartialDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const handleDateChange: PickerBaseProps<"range">["onChange"] = (dateStr) => {
    const dates: [Date | null, Date | null] = [
      dateStr[0] ? new Date(dateStr[0]) : null,
      dateStr[1] ? new Date(dateStr[1]) : null,
    ];
    setPartialDateRange(dates);
    if (dates[0] !== null && dates[1] !== null) {
      onDateChange(dates as [Date, Date]);
    }
  };
  const { isRearranging } = useDashboard();
  const handlePeriodChange = (id: string) => {
    switch (id) {
      case "week":
      case "month":
      case "year":
      case "all":
        onPeriodSelected(id);
        break;
    }
  };
  const handleRearrange = () => {
    onRearrangeCharts();
  };

  console.log("a", currentPeriod);

  const PeriodPicker = () => {
    return (
      <Radio.Group onChange={handlePeriodChange}>
        <Group>
          <Radio iconColor="dark.8" color="lime.4" checked={true} label="Last week" value="week" />
          <Radio checked={currentPeriod === "month"} label="Last month" value="month" />
          <Radio checked={currentPeriod === "year"} label="Last year" value="year" />
          <Radio checked={currentPeriod === "all"} label="All" value="all" />
          <Menu.Target>
            <ActionIcon m={0} variant="subtle" size="">
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
        <Breadcrumbs separator="|" separatorMargin={"md"}>
          <PeriodPicker />
          <Flex gap={"lg"} align={"center"}>
            {!isRearranging ? (
              <>
                <ActionIcon m={0} variant="transparent" size="md" onClick={handleRearrange}>
                  <IconSettings />
                </ActionIcon>
                <ActionIcon m={0} variant="filled" size="lg" radius={"xl"} onClick={onNewChart}>
                  <IconPlus />
                </ActionIcon>
              </>
            ) : (
              <ActionIcon m={0} variant="filled" size="lg" radius={"xl"} onClick={handleRearrange}>
                <IconCheck />
              </ActionIcon>
            )}
          </Flex>
        </Breadcrumbs>
      </Flex>

      <Menu.Dropdown w={300}>
        <Flex justify={"space-between"} p={"md"} gap={"md"}>
          <DatePicker type="range" value={partialDateRange} onChange={handleDateChange} />
        </Flex>
      </Menu.Dropdown>
    </Menu>
  );
}
