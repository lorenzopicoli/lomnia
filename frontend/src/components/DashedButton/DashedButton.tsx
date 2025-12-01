import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

export function DashedButton(props: { label: string; onClick: () => void }) {
  return (
    <Button
      variant="default"
      onClick={props.onClick}
      leftSection={<IconPlus size={16} />}
      styles={{
        root: {
          border: "2px dashed var(--mantine-color-dark-4)",
          backgroundColor: "transparent",
          color: "var(--mantine-color-dark-3)",
        },
      }}
    >
      {props.label}
    </Button>
  );
}
