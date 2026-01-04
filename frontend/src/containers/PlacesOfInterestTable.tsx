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

type PlaceOfInterest = RouterOutputs["placesOfInterest"]["getTable"]["entries"][number];
export function PlacesOfInterestTable(props: { search?: string }) {
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
    trpc.placesOfInterest.getTable.queryOptions({
      page: params.page ?? 1,
      search,
      limit: 100,
    }),
  );
  const { page, entries, total, limit } = data ?? {};

  const { mutate: deletePoi } = useMutation(
    trpc.placesOfInterest.delete.mutationOptions({
      onSuccess() {
        refetchData();
        notifications.show({
          color: theme.colors.green[9],
          title: "Place deleted",
          message: "",
        });
      },
    }),
  );

  const handleDelete = (id: number) => {
    modals.openConfirmModal({
      title: "Are you sure?",
      children: <Text size="sm">Deleting this place means no location will be linked to this</Text>,
      confirmProps: {
        color: theme.colors.red[9],
      },
      labels: { confirm: "Delete", cancel: "Cancel" },
      onConfirm: () => deletePoi(id),
      onCancel: () => {},
    });
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset pagination if search changes
  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      page: 1,
    }));
  }, [search]);
  const columns: TableColumn<PlaceOfInterest>[] = [
    {
      key: "name",
      header: "Name",
      render: (poi) => poi.name,
    },
    {
      key: "city",
      header: "City",
      render: (poi) => poi.city,
    },
    {
      key: "country",
      header: "Country",
      render: (poi) => poi.country,
    },
    {
      key: "createdAt",
      header: "Created At",
      render: (poi) => poi.createdAt?.toLocaleString(),
    },
    {
      key: "actions",
      header: "Actions",
      width: 200,
      render: (poi) => (
        <Group>
          <ActionIcon component={Link} to={`/poi/${poi.id}/edit`} flex={0} variant="subtle">
            <IconPencil size={20} />
          </ActionIcon>
          <ActionIcon flex={0} variant="subtle" onClick={() => handleDelete(poi.id)}>
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
      getRowKey={(poi) => poi.id}
      isLoading={isLoading}
      page={page}
      limit={limit}
      total={total}
      onNextPage={handleNextPage}
      onPrevPage={handlePrevPage}
    />
  );
}
