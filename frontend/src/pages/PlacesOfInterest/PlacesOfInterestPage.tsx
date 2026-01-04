import { ActionIcon, Container, Flex, Input, Paper, Stack } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { StringParam, useQueryParams } from "use-query-params";
import { PlacesOfInterestTable } from "../../containers/PlacesOfInterestTable";
import { useConfig } from "../../contexts/ConfigContext";

export function PlacesOfInterestPage() {
  const { theme } = useConfig();
  const [params, setParams] = useQueryParams({
    search: StringParam,
  });

  const search = params.search ?? "";
  const [debouncedParams] = useDebouncedValue(params, 300);
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setParams({ search: event.currentTarget.value });
  };

  return (
    <Paper component={Container} fluid bg={theme.colors.dark[9]}>
      <Stack pt={"md"} h="100vh" style={{ overflow: "hidden" }}>
        <Flex w={"100%"} direction={"row"} justify={"space-between"} align={"center"} p={0}>
          <Container p={0} m={0} flex={1}>
            <Input
              flex={1}
              onChange={handleSearchChange}
              value={search}
              placeholder="Search"
              leftSection={<IconSearch size={16} />}
              maw={400}
            />
          </Container>
          <Flex p={0} m={0} align={"center"} gap={"lg"}>
            <ActionIcon m={0} variant="filled" size="lg" radius={"xl"} component={Link} to="/poi/add">
              <IconPlus />
            </ActionIcon>
          </Flex>
        </Flex>

        <PlacesOfInterestTable search={debouncedParams.search ?? undefined} />
      </Stack>
    </Paper>
  );
}
