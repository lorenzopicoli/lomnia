import { ActionIcon, Flex, Group, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

export function Pagination(props: {
  limit: number;
  page: number;
  total: number;

  onNextPage: () => void;
  onPrevPage: () => void;
}) {
  const { limit, page, total, onNextPage, onPrevPage } = props;
  const first = (page - 1) * limit + 1;
  const last = Math.min(total, first + limit - 1);
  return (
    <Flex justify={"flex-end"}>
      <Group p={"sm"}>
        <Flex>
          <Text fz={"sm"} span>
            <Text fz={"sm"} span fw={"bolder"}>
              {`${first}-${last} `}
            </Text>
            of {total}
          </Text>
        </Flex>
        <ActionIcon variant="transparent" onClick={onPrevPage} disabled={page === 1}>
          <IconChevronLeft />
        </ActionIcon>
        <ActionIcon variant="transparent" onClick={onNextPage} disabled={last >= total}>
          <IconChevronRight />
        </ActionIcon>
      </Group>
    </Flex>
  );
}
