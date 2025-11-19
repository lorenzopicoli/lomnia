import { type MantineColor, rem, ThemeIcon } from "@mantine/core";
import type { Icon, IconProps } from "@tabler/icons-react";
import type { ComponentType, ForwardRefExoticComponent, RefAttributes } from "react";

type LoIconProps = {
  color: MantineColor;
  Icon: ComponentType<IconProps> | ForwardRefExoticComponent<Omit<IconProps, "ref"> & RefAttributes<Icon>>;
};

export function LoIcon(props: LoIconProps) {
  const { Icon } = props;
  return (
    <ThemeIcon size={rem(30)} radius="xl" color={props.color}>
      <Icon style={{ width: rem(20), height: rem(20) }} />
    </ThemeIcon>
  );
}
