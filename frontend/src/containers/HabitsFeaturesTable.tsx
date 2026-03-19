import { Skeleton, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { NumberParam, StringParam, useQueryParams } from "use-query-params";
import { trpc } from "../api/trpc";
import { List } from "../components/List/List";
import { HabitFeatureRow } from "../components/Rows/HabitFeatureRow";
import { useConfig } from "../contexts/ConfigContext";

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
    <List
      data={entries ?? []}
      page={page}
      total={total}
      limit={limit}
      isLoading={isLoading}
      renderRow={(row) => <HabitFeatureRow feature={row} />}
      loadingRow={<Skeleton />}
      onPageChange={(newPage) =>
        setParams({
          page: newPage,
        })
      }
    />
  );
}
