import { Card, Container, Flex, Paper, ScrollArea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [rules, setRules] = useState<HabitFeatureRule[]>([]);
  const { mutate: saveHabitFeature } = useMutation(
    trpc.habits.saveHabitFeature.mutationOptions({
      onSuccess() {
        navigate({
          pathname: "/habits/features",
        });
        notifications.show({
          title: "Habit Feature Created",
          message: "You can now create charts using the new feature",
        });
      },
    }),
  );

  const handleSave = useCallback(
    (feature: HabitFeature) => {
      saveHabitFeature(feature);
    },
    [saveHabitFeature],
  );

  return (
    <Paper component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <ScrollArea h={safeScrollableArea} type="never">
        <Flex p={"lg"} gap={"lg"} mih={"90vh"} direction={"row"}>
          {/* Left panel */}
          <Card p={"md"} w={"40%"} bg={cardDarkBackground}>
            <HabitFeatureBuilder onChange={setRules} onSave={handleSave} />
          </Card>
          {/* Right panel */}
          <Card flex={1} w={"60%"} bg={cardDarkBackground}>
            <AddHabitFeaturePreview rules={rules} />
          </Card>
        </Flex>
      </ScrollArea>
    </Paper>
  );
}
