import { Skeleton } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { NumberParam, StringParam, useQueryParams } from "use-query-params";
import { trpc } from "../api/trpc";
import { List } from "../components/List/List";
import { SleepRow } from "../components/Rows/SleepRow";

export function SleepsList(props: { search?: string }) {
  const { search } = props;
  const [params, setParams] = useQueryParams({
    search: StringParam,
    page: NumberParam,
  });

  const { data, isLoading } = useQuery(
    trpc.sleep.getTable.queryOptions({
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
      renderRow={(row) => <SleepRow {...row} />}
      loadingRow={<Skeleton />}
      onPageChange={handlePageChange}
    />
  );
}
