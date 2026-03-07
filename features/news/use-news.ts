import { fetchBlogPosts } from "@/services/psn-news";
import { useInfiniteQuery } from "@tanstack/react-query";

export function useNews() {
  const query = useInfiniteQuery({
    queryKey: ["news"],
    queryFn: ({ pageParam = 1 }) => fetchBlogPosts(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length > 0 ? allPages.length + 1 : undefined,
    staleTime: 1000 * 60 * 15,
  });

  const posts = query.data?.pages.flat() ?? [];

  return {
    posts,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
