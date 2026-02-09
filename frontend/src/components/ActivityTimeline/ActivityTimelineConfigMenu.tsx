import { Group, Switch } from "@mantine/core";

export type TimelineFilters = {
  habit: boolean;
  location: boolean;
  website: boolean;
};
type Props = { value: TimelineFilters; onChange: (v: TimelineFilters) => void };

export function ActivityTimelineConfigMenu(props: Props) {
  const { value, onChange } = props;
  return (
    <Group p={"sm"} gap="lg">
      <Switch
        label="Habits"
        checked={value.habit}
        onChange={(e) => onChange({ ...value, habit: e.currentTarget.checked })}
      />

      <Switch
        label="Locations"
        checked={value.location}
        onChange={(e) => onChange({ ...value, location: e.currentTarget.checked })}
      />

      <Switch
        label="Websites"
        checked={value.website}
        onChange={(e) => onChange({ ...value, website: e.currentTarget.checked })}
      />
    </Group>
  );
}
