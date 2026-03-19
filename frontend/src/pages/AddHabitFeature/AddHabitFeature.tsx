import { Card, Container, Flex, Paper, ScrollArea, Skeleton } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "../../api/trpc";
import { safeScrollableArea } from "../../constants";
import { AddHabitFeaturePreview } from "../../containers/AddHabitFeaturePreview/AddHabitFeaturePreview";
import { HabitFeatureBuilder } from "../../containers/HabitFeatureBuilder/HabitFeatureBuilder";
import type { HabitFeature, HabitFeatureRule } from "../../containers/HabitFeatureBuilder/types";
import { useConfig } from "../../contexts/ConfigContext";
import { cardDarkBackground } from "../../themes/mantineThemes";

export function AddHabitFeature() {
  const { theme } = useConfig();
  const navigate = useNavigate();
  const { featureId } = useParams<{ featureId?: string }>();

  const isEditing = !!featureId;
  const { data: featureToEdit, isFetching } = useQuery(
    trpc.habitFeatures.getById.queryOptions(+(featureId || 0), { enabled: isEditing, gcTime: 0 }),
  );

  const [rules, setRules] = useState<HabitFeatureRule[]>([]);
  const { mutate: saveHabitFeature } = useMutation(
    trpc.habitFeatures.save.mutationOptions({
      onSuccess() {
        navigate({
          pathname: "/habits/features",
        });
        notifications.show({
          color: theme.colors.green[9],
          title: isEditing ? "Habit Feature Updated" : "Habit Feature Created",
          message: "You can now create charts using the new feature",
        });
      },
    }),
  );

  useEffect(() => {
    if (featureToEdit) {
      setRules(featureToEdit.rules);
    }
  }, [featureToEdit]);
  const [debouncedRules] = useDebouncedValue(rules, 200);

  const handleSave = useCallback(
    (feature: HabitFeature) => {
      saveHabitFeature({ ...feature, id: featureToEdit?.id });
    },
    [saveHabitFeature, featureToEdit?.id],
  );

  return (
    <Paper component={Container} p={0} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <ScrollArea h={safeScrollableArea} type="never">
        <Flex p={"md"} gap={"md"} mih={"90vh"} direction={{ base: "column", md: "row" }}>
          {/* Left panel */}
          <Card bdrs={"md"} p={"md"} w={{ base: "100%", md: "40%" }} bg={cardDarkBackground}>
            {isFetching ? (
              <Skeleton h={"100%"} w={"100%"} />
            ) : (
              <HabitFeatureBuilder onChange={setRules} onSave={handleSave} initialData={featureToEdit} />
            )}
          </Card>
          {/* Right panel */}
          <Card bdrs={"md"} flex={1} w={{ base: "100%", md: "60%" }} bg={cardDarkBackground}>
            {isFetching ? <Skeleton h={"100%"} w={"100%"} /> : <AddHabitFeaturePreview rules={debouncedRules} />}
          </Card>
        </Flex>
      </ScrollArea>
    </Paper>
  );
}
