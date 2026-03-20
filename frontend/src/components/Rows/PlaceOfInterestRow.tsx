import { alpha, Box, Group, Stack, Text } from "@mantine/core";
import { IconMap } from "@tabler/icons-react";
import { useConfig } from "../../contexts/ConfigContext";
import { UnstyledLink } from "../UnstyledLink/UnstyledLink";

type PlaceOfInterestRowProps = {
  poi: {
    id: number;
    name: string;
    createdAt: string | null;
    city: string | null;
    country: string;
  };
};

export function PlaceOfInterestRow({ poi }: PlaceOfInterestRowProps) {
  const { theme } = useConfig();
  return (
    <UnstyledLink to={`/poi/${poi.id}/edit`}>
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
            <IconMap color={theme.colors.violet[4]} size={18} />
          </Box>

          <Stack gap={4}>
            <Text fw={600}>{poi.name}</Text>

            <Text size="sm" c="dimmed">
              {poi.city} - {poi.country}
            </Text>
          </Stack>
        </Group>
      </Group>
    </UnstyledLink>
  );
}
