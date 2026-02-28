/**
 * Pagination Hook for FlatList
 * Implements efficient pagination to load items incrementally instead of all at once
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export const usePagination = (
  fetchFunc,
  initialPageSize = 10,
  pageSize = 10,
) => {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFunc(0, initialPageSize);
      setData(Array.isArray(result) ? result : []);
      setCurrentPage(0);
      setHasMore(result?.length >= initialPageSize);
    } catch (err) {
      setError(err.message || 'Error loading data');
      setData([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [fetchFunc, initialPageSize]);

  // Fetch next page
  const fetchNextPage = useCallback(async () => {
    if (!hasMore || isFetchingRef.current || loading) return;
    
    isFetchingRef.current = true;
    
    try {
      const nextPage = currentPage + 1;
      const result = await fetchFunc(nextPage * pageSize, pageSize);
      
      if (Array.isArray(result) && result.length > 0) {
        setData(prev => [...prev, ...result]);
        setCurrentPage(nextPage);
        setHasMore(result.length >= pageSize);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setError(err.message || 'Error loading more data');
    } finally {
      isFetchingRef.current = false;
    }
  }, [fetchFunc, pageSize, currentPage, hasMore, loading]);

  // Refresh - reload from beginning
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  }, [fetchInitialData]);

  // Reset pagination
  const reset = useCallback(() => {
    setData([]);
    setCurrentPage(0);
    setHasMore(true);
    setError(null);
    isFetchingRef.current = false;
  }, []);

  return {
    data,
    loading,
    hasMore,
    error,
    refreshing,
    fetchInitialData,
    fetchNextPage,
    refresh,
    reset,
    currentPage,
  };
};

/**
 * Hook for infinite scroll with threshold
 */
export const useInfiniteScroll = (data, onEndReached, threshold = 0.5) => {
  const onEndReachedThreshold = Math.max(threshold, 0.1); // Minimum 0.1 to avoid too frequent calls
  
  return {
    onEndReached: ({ distanceFromEnd }) => {
      if (distanceFromEnd < 0) {
        onEndReached();
      }
    },
    onEndReachedThreshold,
  };
};

export default usePagination;
