import { alpha, Box, Group, Stack, Text } from "@mantine/core";
import { useConfig } from "../../contexts/ConfigContext";
import { UnstyledLink } from "../UnstyledLink/UnstyledLink";

type PlaceOfInterestRowProps = {
  poi: {
    id: number;
    name: string;
    createdAt: string | null;
    city: string | null;
    country: string;
    // JSON feature
    geoJson?: unknown;
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
            <svg width={25} height={25} viewBox="0 0 24 24">
              <title>{poi.name}</title>
              <GeoJsonPreview geoJson={poi.geoJson} />
            </svg>
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

/**
 * This function is AI generated
 */
function GeoJsonPreview({ geoJson }: { geoJson: any }) {
  const { theme } = useConfig();
  try {
    const geometry = geoJson.geometry;

    if (geometry.type === "Polygon") {
      const coords: [number, number][] = geometry.coordinates[0]; // outer ring

      // 1. Find bounds
      const xs = coords.map((c) => c[0]);
      const ys = coords.map((c) => c[1]);

      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const width = maxX - minX || 1;
      const height = maxY - minY || 1;

      // 2. Normalize to 0–24 (your SVG size)
      const normalized = coords.map(([x, y]) => {
        const nx = ((x - minX) / width) * 20 + 2;
        const ny = ((y - minY) / height) * 20 + 2;

        // Flip Y axis (important for correct orientation)
        return `${nx},${24 - ny}`;
      });

      const points = normalized.join(" ");

      return (
        <polygon
          points={points}
          fill={theme.colors.violet[4]}
          stroke={theme.colors.violet[9]}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      );
    }

    return null;
  } catch {
    return null;
  }
}
