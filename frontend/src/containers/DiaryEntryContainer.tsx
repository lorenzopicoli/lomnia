import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns/format";
import { memo } from "react";
import { trpc } from "../api/trpc";
import DiaryEntry from "../components/DiaryEntry/DiaryEntry";
import { useConfig } from "../utils/useConfig";

type DiaryEntryContainer = {
  date: Date;
};

export const DiaryEntryContainer = memo((props: DiaryEntryContainer) => {
  const config = useConfig();
  const { data, isLoading } = useQuery(
    trpc.getDiaryEntriesByDay.queryOptions({
      day: format(props.date, "yyyy-MM-dd"),
      privateMode: config.privateMode,
    }),
  );

  if (isLoading) {
    return "Loading...";
  }

  if (!data) {
    return "No data";
  }

  return (
    <DiaryEntry content={data.content} tags={data.tags ?? []} relativePath={data.relativePath} source={data.source} />
  );
});
