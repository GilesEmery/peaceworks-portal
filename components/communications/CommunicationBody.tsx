import { Fragment } from "react";

import {
  parseCommunicationBody,
  type CommunicationInline,
} from "../../lib/communications/formatting";

export default function CommunicationBody({ body }: { body: string }) {
  return parseCommunicationBody(body).map((block, blockIndex) => {
    if (block.type === "heading") {
      const content = renderInline(block.content, `heading-${blockIndex}`);
      if (block.level === 2) return <h2 key={blockIndex}>{content}</h2>;
      if (block.level === 3) return <h3 key={blockIndex}>{content}</h3>;
      return <h4 key={blockIndex}>{content}</h4>;
    }
    if (block.type === "list") {
      const items = block.items.map((item, itemIndex) => (
        <li key={itemIndex}>{renderInline(item, `list-${blockIndex}-${itemIndex}`)}</li>
      ));
      return block.ordered
        ? <ol key={blockIndex}>{items}</ol>
        : <ul key={blockIndex}>{items}</ul>;
    }
    return (
      <p key={blockIndex}>
        {block.lines.map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            {lineIndex > 0 && <br />}
            {renderInline(line, `paragraph-${blockIndex}-${lineIndex}`)}
          </Fragment>
        ))}
      </p>
    );
  });
}

function renderInline(items: CommunicationInline[], keyPrefix: string) {
  return items.map((item, index) => {
    const key = `${keyPrefix}-${index}`;
    if (item.type === "bold") return <strong key={key}>{item.value}</strong>;
    if (item.type === "italic") return <em key={key}>{item.value}</em>;
    if (item.type === "link") {
      return <a key={key} href={item.url} target="_blank" rel="noopener noreferrer">{item.value}</a>;
    }
    return <Fragment key={key}>{item.value}</Fragment>;
  });
}
