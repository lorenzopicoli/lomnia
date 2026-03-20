import { Skeleton, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { NumberParam, StringParam, useQueryParams } from "use-query-params";
import { type RouterOutputs, trpc } from "../api/trpc";
import { List } from "../components/List/List";
import { PlaceOfInterestRow } from "../components/Rows/PlaceOfInterestRow";
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
    <List
      data={entries ?? []}
      page={page}
      total={total}
      limit={limit}
      isLoading={isLoading}
      renderRow={(row) => <PlaceOfInterestRow poi={row} />}
      loadingRow={<Skeleton />}
      onPageChange={(newPage) =>
        setParams({
          page: newPage,
        })
      }
    />

    // <Table
    //   data={entries ?? []}
    //   columns={columns}
    //   getRowKey={(poi) => poi.id}
    //   isLoading={isLoading}
    //   page={page}
    //   limit={limit}
    //   total={total}
    //   onNextPage={handleNextPage}
    //   onPrevPage={handlePrevPage}
    // />
  );
}
