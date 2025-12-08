import { ActionIcon, alpha, Group, TextInput } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { IconTrash } from "@tabler/icons-react";
import type { ChangeEvent } from "react";
import { useConfig } from "../../contexts/ConfigContext";

interface DashboardTabContentProps {
  dashboardName: string;
  isEditing: boolean;
  onRename: (name: string) => void;
  onRemove: () => void;
}

export function DashboardTabTab(props: DashboardTabContentProps) {
  const { theme } = useConfig();
  const { dashboardName, isEditing, onRename, onRemove } = props;

  const handleChangeDashboardName = useDebouncedCallback((e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    onRename(name);
  }, 500);

  const handleRemoveDashboard = () => {
    onRemove();
  };

  if (!isEditing) {
    return <>{dashboardName}</>;
  }

  return (
    <Group gap="xs">
      <TextInput
        defaultValue={dashboardName}
        onClick={(e) => e.stopPropagation()}
        size="xs"
        onChange={handleChangeDashboardName}
        styles={{
          input: {
            fontSize: "inherit",
          },
        }}
      />
      <ActionIcon onMouseDown={(e) => e.stopPropagation()} onClick={handleRemoveDashboard} size="lg" variant="light">
        <IconTrash size={20} color={alpha(theme.colors.red[9], 0.8)} />
      </ActionIcon>
    </Group>
  );
}
