import { alpha, Box, Group, Stack, Text } from "@mantine/core";
import { IconArrowsShuffle, IconBrackets, IconLetterA, IconList } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { useConfig } from "../../contexts/ConfigContext";
import { UnstyledLink } from "../UnstyledLink/UnstyledLink";

type HabitFeatureRowProps = {
  feature: {
    extractionType: string;
    id: number;
    matchedHabitEntries: number;
    name: string;
    lastMatched: string;
  };
};

function getExtractionTypeIcon(type: string) {
  switch (type) {
    case "array_values":
      return IconList;
    case "constant":
      return IconLetterA;
    case "map_values":
      return IconArrowsShuffle;
    case "entry_value":
      return IconBrackets;
    default:
      return IconLetterA;
  }
}

function formatLastMatched(dateString: string) {
  if (!dateString) return "Never";

  try {
    const date = new Date(dateString);

    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "Unknown";
  }
}
export function HabitFeatureRow({ feature }: HabitFeatureRowProps) {
  const { theme } = useConfig();
  const Icon = getExtractionTypeIcon(feature.extractionType);

  return (
    <UnstyledLink to={`/habits/features/edit/${feature.id}`}>
      <Group p={3} justify="space-between" align="center">
        <Group align="flex-start" gap="md">
          <Box
            bdrs={"md"}
            h={36}
            w={36}
            display={"flex"}
            style={{
              backgroundColor: alpha(theme.colors.gray[6], 0.15),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon color={theme.colors.violet[4]} size={18} />
          </Box>

          <Stack gap={4}>
            <Text fw={600}>{feature.name}</Text>

            <Text size="sm" c="dimmed">
              {feature.matchedHabitEntries} habits matched
            </Text>

            <Text size="xs" c="dimmed">
              {`Last matched ${formatLastMatched(feature.lastMatched)}`}
            </Text>
          </Stack>
        </Group>
      </Group>
    </UnstyledLink>
  );
}
