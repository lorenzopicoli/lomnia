import { Anchor, Chip, Group, Text } from "@mantine/core";
import Markdown from "react-markdown";
import wikiLinkPlugin from "remark-wiki-link";
import { Anonymize } from "../Anonymize/Anonymize";

export type DiaryEntryProps = {
  content: string;
  tags: string[];
  relativePath: string;
  source: string;
};

function DiaryEntry(props: DiaryEntryProps) {
  return (
    <div>
      <Anonymize>
        <Markdown
          remarkPlugins={[wikiLinkPlugin]}
          components={{
            // Override links with mantine Anchor
            a({ children: aChildren, ...aProps }) {
              return (
                <Anchor c={"primary"} href={aProps.href}>
                  <Anonymize>{aChildren}</Anonymize>
                </Anchor>
              );
            },
          }}
        >
          {props.content}
        </Markdown>
      </Anonymize>
      <Group>
        {props.tags.map((tag) => (
          <Chip icon={<Text size="lg">#</Text>} key={tag} checked variant="light" radius={"lg"}>
            {tag}
          </Chip>
        ))}
      </Group>
    </div>
  );
}

export default DiaryEntry;
