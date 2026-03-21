import { Skeleton } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { NumberParam, StringParam, useQueryParams } from "use-query-params";
import { trpc } from "../api/trpc";
import { List } from "../components/List/List";
import { PlaceOfInterestRow } from "../components/Rows/PlaceOfInterestRow";

export function PlacesOfInterestTable(props: { search?: string }) {
  const { search } = props;
  const [params, setParams] = useQueryParams({
    search: StringParam,
    page: NumberParam,
  });

  const { data, isLoading } = useQuery(
    trpc.placesOfInterest.getTable.queryOptions({
      page: params.page ?? 1,
      search,
      limit: 100,
    }),
  );
  const { page, entries, total, limit } = data ?? {};

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset pagination if search changes
  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      page: 1,
    }));
  }, [search]);

  const handlePageChange = (newPage: number) => {
    setParams({
      page: newPage,
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
      onPageChange={handlePageChange}
    />
  );
}
