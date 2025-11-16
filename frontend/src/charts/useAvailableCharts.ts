import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { type RouterOutputs, trpc } from "../api/trpc";

/**
 * Small wrapper around the availableKeys API call to aovid it being called more than once
 */
export function useAvailableCharts(): {
  refetch: () => void;
  isLoading: boolean;
  availableKeys?: RouterOutputs["getAvailableKeys"];
} {
  const [alreadyFetched, setAlreadyFetched] = useState(false);
  const { data, isLoading } = useQuery(
    trpc.getAvailableKeys.queryOptions(undefined, {
      enabled: !alreadyFetched,
    }),
  );

  useEffect(() => {
    if (data && !alreadyFetched) {
      setAlreadyFetched(true);
    }
  }, [data, alreadyFetched]);
  const refetch = useMemo(() => () => setAlreadyFetched(false), []);
  const response = useMemo(() => ({ refetch, availableKeys: data, isLoading }), [refetch, data, isLoading]);
  return response;
}
