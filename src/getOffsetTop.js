export default function getOffsetTop(node) {
  const { top } = node.getBoundingClientRect();
  const scrollTop = window.pageYOffset;
  const clientTop = document.body.clientTop || 0;
  return top + scrollTop - clientTop;
}
