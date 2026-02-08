import { ActionIcon, Button, Group, Menu, Space, Title } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { IconChevronLeft, IconChevronRight, IconSettings } from "@tabler/icons-react";
import { addDays, isToday, subDays } from "date-fns";
import { ActivityTimelineConfigMenu, type TimelineFilters } from "./ActivityTimelineConfigMenu";

type Props = {
  formattedDate: string;
  date: Date;
  filters: TimelineFilters;
  onDateChange: (newDate: Date) => void;
  onFiltersChange: (newFilters: TimelineFilters) => void;
};

export function ActivityTimelineControls(props: Props) {
  const { formattedDate, date, filters, onDateChange, onFiltersChange } = props;
  const handleNextDay = () => {
    const dayAfter = addDays(date, 1);
    onDateChange(dayAfter);
  };

  const handlePreviousDayClick = () => {
    const dayBefore = subDays(date, 1);
    onDateChange(dayBefore);
  };

  const handlePickerChange = (value: string | null) => {
    const date = value ? new Date(value) : new Date();
    onDateChange(date);
  };
  return (
    <Group pr={"md"} pl={"md"} justify="space-between" w={"100%"}>
      <Group gap={0}>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button component={Title} fw={400} order={2} c={"unset"} p={0} variant="transparent">
              {formattedDate}
            </Button>
          </Menu.Target>
          <Menu.Dropdown w={270}>
            <DatePicker type="default" value={date} onChange={handlePickerChange} />
          </Menu.Dropdown>
          <Space w={"xl"} />
          <ActionIcon variant="transparent" onClick={handlePreviousDayClick}>
            <IconChevronLeft />
          </ActionIcon>
          <Space w={"lg"} />
          <ActionIcon variant="transparent" onClick={handleNextDay} disabled={isToday(date)}>
            <IconChevronRight />
          </ActionIcon>
        </Menu>
      </Group>
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon m={0} variant="transparent" size="md" onClick={() => {}}>
            <IconSettings />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <ActivityTimelineConfigMenu value={filters} onChange={onFiltersChange} />
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
