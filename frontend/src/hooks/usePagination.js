import { useState, useMemo, useEffect } from "react";

export default function usePagination(data, itemsPerPage = 10, deps = []) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when any dependency changes (search, filter, sort, tab, etc.)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setCurrentPage(1); }, deps);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages || 1)));
  };

  return { currentPage, totalPages, paginatedData, goToPage };
}
