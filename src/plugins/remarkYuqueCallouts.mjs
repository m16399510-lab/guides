const calloutNames = new Map([
  ["success", "success"],
  ["danger", "danger"],
  ["warning", "warning"],
  ["info", "info"],
  ["color1", "note"],
  ["color2", "note"],
  ["color3", "note"],
  ["color4", "note"],
  ["color5", "note"]
]);

export default function remarkYuqueCallouts() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== "containerDirective") return;

      const kind = calloutNames.get(node.name);
      if (!kind) return;

      node.data ||= {};
      node.data.hName = "aside";
      node.data.hProperties = {
        className: ["callout", `callout-${kind}`]
      };
    });
  };
}

function walk(node, visitor) {
  visitor(node);

  if (!Array.isArray(node.children)) return;

  for (const child of node.children) {
    walk(child, visitor);
  }
}

