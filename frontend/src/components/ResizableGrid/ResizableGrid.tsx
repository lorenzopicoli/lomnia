import { Container } from "@mantine/core";
import { IconBorderCornerSquare } from "@tabler/icons-react";
import { forwardRef, type ReactNode } from "react";
import { type Layouts, Responsive, type ResponsiveProps, WidthProvider } from "react-grid-layout";

const ResizeHandle = forwardRef((props, ref) => {
  // Can't really find the typing for this
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { handleAxis, ...restProps } = props as any;
  return (
    <div ref={ref} className={`react-resizable-handle react-resizable-handle-${handleAxis}`} {...restProps}>
      <IconBorderCornerSquare style={{ transform: "rotate(-180deg)" }} />
    </div>
  );
});

const ResponsiveGridLayout = WidthProvider(Responsive);

export type ResizableGridProps = {
  layout: Layouts;
  children: ReactNode;
} & ResponsiveProps;

const GRID_MARGIN = 20;

export function ResizableGrid(props: ResizableGridProps) {
  const { children, layout, ...otherProps } = props;
  return (
    // The responsive grid has a margin of 10px which acts as a gutter
    // To keep the sides aligned we add those 10px to the max width of the
    // container and add some negative margin on each side
    <Container maw={`calc(100% + ${GRID_MARGIN * 2}px)`} m={0} ml={-GRID_MARGIN} mr={-GRID_MARGIN} p={0}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layout}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        margin={{ lg: [20, 20], md: [20, 20], sm: [20, 20], xs: [20, 20], xxs: [20, 20] }}
        resizeHandles={["se"]}
        resizeHandle={<ResizeHandle />}
        {...otherProps}
      >
        {children}
      </ResponsiveGridLayout>
    </Container>
  );
}
