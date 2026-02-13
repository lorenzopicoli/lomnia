import { ActionIcon, Button, Group, Menu, Title } from "@mantine/core";
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
    <Group w="100%" px="md" justify="space-between" align="center" wrap="nowrap">
      <Group gap="xs" wrap="wrap" align="center" style={{ flex: 1, minWidth: 0 }}>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button
              component={Title}
              order={2}
              fw={400}
              c="unset"
              p={0}
              variant="transparent"
              fz={{ base: "h4", xs: "h2" }}
              ta={"left"}
              miw={0}
            >
              {formattedDate}
            </Button>
          </Menu.Target>

          <Menu.Dropdown w={270}>
            <DatePicker type="default" value={date} onChange={handlePickerChange} />
          </Menu.Dropdown>
        </Menu>

        <Group gap={4} wrap="nowrap">
          <ActionIcon variant="transparent" onClick={handlePreviousDayClick}>
            <IconChevronLeft />
          </ActionIcon>

          <ActionIcon variant="transparent" onClick={handleNextDay} disabled={isToday(date)}>
            <IconChevronRight />
          </ActionIcon>
        </Group>
      </Group>

      <Menu shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon variant="transparent" size="md">
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
