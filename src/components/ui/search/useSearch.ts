import { useState, useMemo, useEffect } from "react";

interface UseSearchProps<T> {
  data: T[];
  searchFields: (keyof T)[];
  debounceDelay?: number;
}

interface UseSearchReturn<T> {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredData: T[];
}

export function useSearch<T>({
  data,
  searchFields,
  debounceDelay = 300,
}: UseSearchProps<T>): UseSearchReturn<T> {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceDelay]);

  const filteredData = useMemo(() => {
    if (!debouncedQuery.trim()) return data;

    const query = debouncedQuery.toLowerCase();

    return data.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (typeof value === "string") {
          return value.toLowerCase().includes(query);
        }
        return false;
      }),
    );
  }, [data, debouncedQuery, searchFields]);

  return {
    searchQuery,
    setSearchQuery,
    filteredData,
  };
}
