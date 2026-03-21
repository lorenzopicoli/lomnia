import { Skeleton } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { NumberParam, StringParam, useQueryParams } from "use-query-params";
import { trpc } from "../api/trpc";
import { List } from "../components/List/List";
import { HabitFeatureRow } from "../components/Rows/HabitFeatureRow";

export function HabitsFeaturesList(props: { search?: string }) {
  const { search } = props;
  const [params, setParams] = useQueryParams({
    search: StringParam,
    page: NumberParam,
  });
  const { data, isLoading } = useQuery(
    trpc.habitFeatures.getTable.queryOptions({
      page: params.page ?? 1,
      search,
      limit: 100,
    }),
  );

  const handlePageChange = (newPage: number) => {
    setParams({
      page: newPage,
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
      onPageChange={handlePageChange}
    />
  );
}
