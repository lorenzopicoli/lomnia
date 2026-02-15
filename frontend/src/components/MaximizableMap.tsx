import { ActionIcon, Box, Modal } from "@mantine/core";
import { IconMaximize } from "@tabler/icons-react";
import { useState } from "react";
import { CommonMap, type CommonMapProps } from "./CommonMap";

export function MaximizableMap(props: CommonMapProps) {
  const [opened, setOpened] = useState(false);
  return (
    <>
      <Box flex={1} mih={0} w="100%" h="100%" style={{ position: "relative" }}>
        <CommonMap {...props} />

        <ActionIcon
          variant="subtle"
          onClick={() => setOpened(true)}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 10,
            backdropFilter: "blur(4px)",
          }}
        >
          <IconMaximize size={18} />
        </ActionIcon>
      </Box>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Map"
        size="90vw"
        radius="md"
        padding={"md"}
        overlayProps={{
          backgroundOpacity: 0.45,
          blur: 3,
        }}
        styles={{
          content: {
            height: "90vh",
            display: "flex",
            flexDirection: "column",
          },
          body: {
            flex: 1,
            padding: 0,
          },
        }}
      >
        <CommonMap {...props} />
      </Modal>
    </>
  );
}
