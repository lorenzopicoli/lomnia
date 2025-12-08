import { ActionIcon, Breadcrumbs, Flex, Group, Menu, Radio } from "@mantine/core";
import { DatePicker, type PickerBaseProps } from "@mantine/dates";
import { IconCalendar, IconCheck, IconPlus, IconSettings } from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCurrentDashboard } from "../../contexts/DashboardContext";
import { useDashboardFilters } from "../../contexts/DashboardFiltersContext";

export function ChartDashboardMenu() {
  const { period, setDateRange, onPeriodSelected } = useDashboardFilters();
  const { dashboardId, isConfiguring, setIsConfiguring } = useCurrentDashboard();
  const [partialDateRange, setPartialDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const handleDateChange: PickerBaseProps<"range">["onChange"] = (dateStr) => {
    const dates: [Date | null, Date | null] = [
      dateStr[0] ? new Date(dateStr[0]) : null,
      dateStr[1] ? new Date(dateStr[1]) : null,
    ];
    setPartialDateRange(dates);
    if (dates[0] !== null && dates[1] !== null) {
      setDateRange(dates as [Date, Date]);
    }
  };
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
    setIsConfiguring(!isConfiguring);
  };

  const PeriodPicker = () => {
    return (
      <Radio.Group value={period} onChange={handlePeriodChange}>
        <Group>
          <Radio label="Last week" value="week" />
          <Radio label="Last month" value="month" />
          <Radio label="Last year" value="year" />
          <Radio label="All" value="all" />
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
            {!isConfiguring ? (
              <>
                <ActionIcon m={0} variant="transparent" size="md" onClick={handleRearrange}>
                  <IconSettings />
                </ActionIcon>
                <ActionIcon
                  component={Link}
                  to={`/dashboard/${dashboardId}/add-chart`}
                  m={0}
                  variant="filled"
                  size="lg"
                  radius={"xl"}
                >
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
