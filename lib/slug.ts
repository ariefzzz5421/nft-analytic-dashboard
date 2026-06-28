export function extractSlug(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return "";
  }

  const withoutQuery = trimmed.split(/[?#]/)[0]?.replace(/\/+$/, "") ?? "";
  const marker = "opensea.io/collection/";

  if (withoutQuery.includes(marker)) {
    const [, afterCollection] = withoutQuery.split(marker);
    return decodeURIComponent(afterCollection.split("/")[0] ?? "").trim();
  }

  return decodeURIComponent(withoutQuery)
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/overview$/i, "")
    .trim();
}
