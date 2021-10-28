import * as React from "react";
import { useRouter } from "next/router";
import { GetStaticProps } from "next";
import InfiniteScroll from "react-infinite-scroll-component";
import Layout from "../../components/layout";
import { supabase } from "../../utils/supabase";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";
import { Resource } from "../../hooks/types";
import { fetchResources } from "../../hooks/fetchResources";
import { sidebarLinks } from "../../utils/nav-menu";
import ResourceCard from "../../components/cards/ResourceCard";

export default function DashboardWithFilter() {
  const router = useRouter();
  const {data} = useQuery(["resources", router.query.category], fetchResources)
  const [deet, setDeets] = React.useState<Resource[] | null | undefined>(data?.data);
  const [hasMore, setHasMore] = React.useState(true);

  const getResourceslength = () => {
    if (deet) {
      return deet.length
    }
    return 0;
  }

  const getMoreResources = async () => {
    const { data, error } = await supabase
      .from<Resource>("resources")
      .select(`*`)
      .filter("tag", "eq", router.query.category)
      .limit(getResourceslength() + 5)
    return { data, error };
  };

  
  return (
    <div>
      <InfiniteScroll
        dataLength={getResourceslength()}
        next={getMoreResources}
        hasMore={hasMore}
        loader={<h3> Loading...</h3>}
        endMessage={<h4>Nothing more to show</h4>}
      >
        <ul
          role="list"
          className={
            "grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 overflow-y-auto py-4"
          }
        >
          {deet &&
            deet.map((item) => (
              <ResourceCard key={item.name} item={item} />
            ))}
        </ul>
      </InfiniteScroll>

      {/* <button onClick={getMoreResources} className="bg-green-500 text-white">Load More</button> */}
    </div>
  );
}

DashboardWithFilter.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>{page}</Layout>;
};

// This function gets called at build time
export async function getStaticPaths() {
  const paths = sidebarLinks.map((link) => ({
    params: { category: link.name },
  }));
  return {
    paths,
    fallback: "blocking",
  };
}

// This function gets called at build time
export const getStaticProps: GetStaticProps = async (context) => {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(
    ["resources", context.params && context.params.category],
    fetchResources
  );

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};
