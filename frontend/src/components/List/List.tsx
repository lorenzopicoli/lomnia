import { Center, Divider, Flex, ScrollArea, Stack } from "@mantine/core";
import type { ReactNode } from "@tabler/icons-react";
import { cardDarkBackground } from "../../themes/mantineThemes";
import { isNumber } from "../../utils/isNumber";
import { Pagination } from "../Pagination/Pagination";

interface ListProps<T> {
  /**
   * Array of data to display
   */
  data: T[];
  /**
   * Render a single row
   */
  renderRow: (row: T) => ReactNode;
  /**
   * Placeholder for when the table is loading
   */
  loadingRow?: ReactNode;
  /**
   * Whether the table is loading
   */
  isLoading?: boolean;

  /**
   * Current page
   */
  page?: number;
  /**
   * Amount of items per page
   */
  limit?: number;
  /**
   * Total items in the list
   */
  total?: number;

  onPageChange?: (page: number) => void;
}

export function List<T>(props: ListProps<T>) {
  const { data, isLoading = false, page, limit, total, renderRow, loadingRow, onPageChange } = props;

  return (
    <Flex
      gap={0}
      direction="column"
      h="100%"
      mb={"sm"}
      mih={0}
      bg={cardDarkBackground}
      bdrs={"md"}
      bd="1px solid var(--mantine-color-dark-7)"
    >
      <ScrollArea flex={1} p={"md"} type={"never"}>
        <Stack>
          {data.map((row) => (
            <>
              {isLoading ? loadingRow : renderRow(row)}
              <Divider />
            </>
          ))}
        </Stack>
      </ScrollArea>
      <Center mb={"sm"}>
        {isNumber(page) && isNumber(total) && isNumber(limit) ? (
          <Pagination
            page={page}
            onPrevPage={() => onPageChange?.((page ?? 0) - 1)}
            onNextPage={() => onPageChange?.((page ?? 0) + 1)}
            total={total}
            limit={limit}
          />
        ) : null}
      </Center>
    </Flex>
  );
}
