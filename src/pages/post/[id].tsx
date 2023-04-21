import { type NextPage } from "next";
import Head from "next/head";

const SinglePostPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Post Page</title>
      </Head>
      <main className="flex h-screen justify-center">
        <div className="">Post View</div>
      </main>
    </>
  );
};

export default SinglePostPage;
