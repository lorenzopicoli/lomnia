import { Container, Paper, ScrollArea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "../../api/trpc";
import { safeScrollableArea } from "../../constants";
import { useConfig } from "../../contexts/ConfigContext";

export function AddPlaceOfInterestPage() {
  const { theme } = useConfig();
  const navigate = useNavigate();
  const { poiId } = useParams<{ poiId?: string }>();

  const isEditing = !!poiId;
  const { data: poiToEdit, isFetching } = useQuery(
    trpc.placesOfInterest.getById.queryOptions(+(poiId || 0), { enabled: isEditing, gcTime: 0 }),
  );

  const { mutate: savePoi } = useMutation(
    trpc.placesOfInterest.save.mutationOptions({
      onSuccess() {
        navigate({
          pathname: "/",
        });
        notifications.show({
          color: theme.colors.green[9],
          title: isEditing ? "Place of Interest Updated" : "Place of Interest Created",
          message: "It might take a while to see locations linked to this place",
        });
      },
    }),
  );

  const handleSave = useCallback(
    (poi: any) => {
      savePoi({ ...poi, id: poiToEdit?.id });
    },
    [savePoi, poiToEdit?.id],
  );

  if (isFetching) {
    return <>Loading...</>;
  }

  return (
    <Paper component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <ScrollArea h={safeScrollableArea} type="never">
        Map
      </ScrollArea>
    </Paper>
  );
}
