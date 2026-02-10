import { Box, Flex, Text } from "@mantine/core";
import { LoIcon } from "../LoIcon";

export interface WeatherInfoItemProps {
  icon: React.ComponentType;
  color: string;
  label: string;
}
export function WeatherInfoItem({ icon, color, label }: WeatherInfoItemProps) {
  return (
    <Flex flex={1} align="center" gap="sm">
      <Box style={{ flexShrink: 0 }}>
        <LoIcon Icon={icon} color={color} />
      </Box>
      <Box style={{ minWidth: 0, overflow: "hidden", flex: 1 }}>
        <Text truncate="end">{label}</Text>
      </Box>
    </Flex>
  );
}
