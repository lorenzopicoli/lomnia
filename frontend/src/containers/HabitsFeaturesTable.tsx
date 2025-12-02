import { ActionIcon, alpha, Group, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { NumberParam, StringParam, useQueryParams } from "use-query-params";
import { type RouterOutputs, trpc } from "../api/trpc";
import { Table, type TableColumn } from "../components/Table/Table";
import { useConfig } from "../contexts/ConfigContext";

type HabitFeature = RouterOutputs["habits"]["getFeaturesTable"]["entries"][number];
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
    trpc.habits.getFeaturesTable.queryOptions({
      page: params.page ?? 1,
      search,
      limit: 100,
    }),
  );
  const { mutate: deleteHabitFeature } = useMutation(
    trpc.habits.deleteHabitFeature.mutationOptions({
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
  const columns: TableColumn<HabitFeature>[] = [
    {
      key: "name",
      header: "Name",
      render: (feature) => feature.name,
    },
    {
      key: "matched",
      header: "# of habits matched",
      render: (feature) => feature.matchedHabitEntries,
    },
    {
      key: "created_at",
      header: "Created At",
      render: (feature) => feature.createdAt?.toLocaleString(),
    },
    {
      key: "actions",
      header: "Actions",
      width: 200,
      render: (feature) => (
        <Group>
          <ActionIcon component={Link} to={`/habits/features/edit/${feature.id}`} flex={0} variant="subtle">
            <IconPencil size={20} />
          </ActionIcon>
          <ActionIcon flex={0} variant="subtle" onClick={() => handleDeleteFeature(feature.id)}>
            <IconTrash size={20} color={alpha(theme.colors.red[9], 0.8)} />
          </ActionIcon>
        </Group>
      ),
    },
  ];

  const handleNextPage = () => {
    setParams({
      page: (page ?? 1) + 1,
    });
  };
  const handlePrevPage = () => {
    setParams({
      page: (page ?? 1) - 1,
    });
  };

  return (
    <Table
      data={entries ?? []}
      columns={columns}
      getRowKey={(feature) => feature.id}
      isLoading={isLoading}
      page={page}
      limit={limit}
      total={total}
      onNextPage={handleNextPage}
      onPrevPage={handlePrevPage}
    />
  );
}
