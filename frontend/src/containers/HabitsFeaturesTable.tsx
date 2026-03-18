import { alpha, Box, Center, Divider, Flex, Group, Pagination, ScrollArea, Stack, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconArrowsShuffle, IconBrackets, IconLetterA, IconList } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { NumberParam, StringParam, useQueryParams } from "use-query-params";
import { type RouterOutputs, trpc } from "../api/trpc";
import { UnstyledLink } from "../components/UnstyledLink/UnstyledLink";
import { useConfig } from "../contexts/ConfigContext";
import { cardDarkBackground } from "../themes/mantineThemes";

type HabitFeature = RouterOutputs["habitFeatures"]["getTable"]["entries"][number];
export function HabitsFeaturesTable(props: { search?: string }) {
  const { theme } = useConfig();
  const { search } = props;
  const [params, setParams] = useQueryParams({
    search: StringParam,
    page: NumberParam,
  });
  const {
    data,
    refetch: refetchData,
    isLoading,
  } = useQuery(
    trpc.habitFeatures.getTable.queryOptions({
      page: params.page ?? 1,
      search,
      limit: 100,
    }),
  );
  const { mutate: deleteHabitFeature } = useMutation(
    trpc.habitFeatures.delete.mutationOptions({
      onSuccess() {
        refetchData();
        notifications.show({
          color: theme.colors.green[9],
          title: "Habit Feature Deleted",
          message: "",
        });
      },
    }),
  );

  const handleDeleteFeature = (id: number) => {
    modals.openConfirmModal({
      title: "Are you sure?",
      children: <Text size="sm">Deleting this habit feature means you won't be able to query this data anymore</Text>,
      confirmProps: {
        color: theme.colors.red[9],
      },
      labels: { confirm: "Delete", cancel: "Cancel" },
      onConfirm: () => deleteHabitFeature(id),
      onCancel: () => {},
    });
  };
  const { page, entries, total, limit } = data ?? {};

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset pagination if search changes
  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      page: 1,
    }));
  }, [search]);

  return (
    <HabitFeaturesList
      data={entries ?? []}
      page={page}
      total={total}
      limit={limit}
      isLoading={isLoading}
      onPageChange={(newPage) =>
        setParams({
          page: newPage,
        })
      }
    />
  );
}

type HabitFeatureRowProps = {
  feature: HabitFeature;
};

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
              {feature.createdAt ? new Date(feature.createdAt).toLocaleString() : "—"}
            </Text>
          </Stack>
        </Group>
      </Group>
    </UnstyledLink>
  );
}

type HabitFeaturesListProps = {
  data: HabitFeature[];
  page?: number;
  total?: number;
  limit?: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
};

export function HabitFeaturesList({
  data,
  page = 1,
  total = 0,
  limit = 10,
  isLoading,
  onPageChange,
}: HabitFeaturesListProps) {
  const totalPages = Math.ceil(total / limit);

  if (!isLoading && data.length === 0) {
    return (
      <Center py="lg">
        <Text c="dimmed">No features found</Text>
      </Center>
    );
  }

  return (
    <Flex gap={0} direction="column" h="100%" mb={"sm"} mih={0} bg={cardDarkBackground} bdrs={"md"}>
      <ScrollArea flex={1} p={"md"}>
        <Stack>
          {data.map((feature) => (
            <>
              <HabitFeatureRow key={feature.id} feature={feature} />
              <Divider />
            </>
          ))}
        </Stack>
      </ScrollArea>
      <Center mb={"sm"}>
        <Pagination size={"md"} value={page} onChange={onPageChange} total={totalPages} />
      </Center>
    </Flex>
  );
}

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
