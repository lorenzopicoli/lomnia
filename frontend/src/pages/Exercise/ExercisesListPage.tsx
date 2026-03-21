import { Container, Flex, Input, Paper, Stack } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import type { ChangeEvent } from "react";
import { Route, Routes } from "react-router-dom";
import { StringParam, useQueryParams } from "use-query-params";
import { smallContentMaxWidth } from "../../constants";
import { ExercisesList } from "../../containers/ExercisesList";
import { useConfig } from "../../contexts/ConfigContext";

export function ExercisesListPage() {
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
      <Stack ml={"auto"} mr={"auto"} maw={smallContentMaxWidth} pt={"md"} h="100vh" style={{ overflow: "hidden" }}>
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
        </Flex>
        <Routes>
          <Route index element={<ExercisesList search={debouncedParams.search ?? undefined} />} />
        </Routes>
      </Stack>
    </Paper>
  );
}
