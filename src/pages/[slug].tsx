import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { api } from "~/utils/api";

const ProfilePage: NextPage<{ name: string }> = ({ name }) => {
  const { data } = api.profile.getUserByName.useQuery({
    name,
  });

  if (!data) return <div>Something went wrong</div>;

  return (
    <>
      <Head>
        <title>{data.name}</title>
      </Head>
      <PageLayout>
        <div className="relative h-48 bg-slate-600">
          <Image
            src={data.image ?? ""}
            alt={data?.name ? `${data?.name}'s profile image` : ""}
            className="border-3 absolute bottom-0 left-0 -mb-[64px] ml-6 rounded-full border-black"
            width={128}
            height={128}
          />
        </div>
        <div>{data?.name ? `@${data?.name}` : ""}</div>
      </PageLayout>
    </>
  );
};

import { createServerSideHelpers } from "@trpc/react-query/server";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import superjson from "superjson";
import { PageLayout } from "~/components/layout";

export const getStaticProps: GetStaticProps = async (content) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, session: null },
    transformer: superjson, // optional - adds superjson serialization
  });

  const slug = content.params?.slug;

  if (typeof slug !== "string") throw new Error("No slug");

  const name = slug.replace("@", "");

  await ssg.profile.getUserByName.prefetch({ name });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      name,
    },
  };
};

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export default ProfilePage;
