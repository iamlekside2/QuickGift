/**
 * Safe pagination from query params: page >= 1, 1 <= per_page <= max. Guards
 * against page=0 / negative offsets (a 500) and unbounded page sizes.
 */
export function paging(q: any, defaultPerPage = 20, maxPerPage = 100) {
  const page = Math.max(1, Math.floor(Number(q?.page)) || 1);
  const perPage = Math.min(
    maxPerPage,
    Math.max(1, Math.floor(Number(q?.per_page)) || defaultPerPage),
  );
  return { page, perPage, offset: (page - 1) * perPage };
}
