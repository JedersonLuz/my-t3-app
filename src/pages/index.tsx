import { type NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";

import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { PageLayout } from "~/components/layout";

dayjs.extend(relativeTime);

const Home: NextPage = () => {
  const { data: sessionData, status } = useSession();

  // Start fetching posts asap
  api.posts.getAll.useQuery();

  // Return empty div if user is not loaded yet
  if (status === "loading") return <div />;

  return (
    <>
      <PageLayout>
        <div className="border-b border-slate-400 p-4">
          {!sessionData && (
            <button
              className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
              onClick={() => void signIn()}
            >
              Sign in
            </button>
          )}
          {sessionData && <CreatePostWizard />}
        </div>
        <Feed />
      </PageLayout>
    </>
  );
};

export default Home;

const CreatePostWizard = () => {
  const { data: sessionData } = useSession();

  const [content, setContent] = useState<string>("");

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setContent("");
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post! Please try again later.");
      }
    },
  });

  if (!sessionData) return null;

  return (
    <div className="flex w-full gap-3">
      <Image
        src={sessionData.user.image ?? ""}
        alt="Profile image"
        className="rounded-full"
        width={56}
        height={56}
      />
      <input
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (content !== "") {
              mutate({ content });
            }
          }
        }}
        disabled={isPosting}
      />
      {!isPosting && (
        <button onClick={() => mutate({ content })} disabled={isPosting}>
          Post
        </button>
      )}
      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={24} />
        </div>
      )}
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

type PostWithAuthor = RouterOutputs["posts"]["getAll"][number];
const PostView = (props: PostWithAuthor) => {
  const { post, author } = props;

  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Image
        src={author.image ?? ""}
        alt={`${author.name ?? ""}'s profile image`}
        className="rounded-full"
        width={56}
        height={56}
      />
      <div className="flex flex-col">
        <div className="flex gap-2 text-slate-300">
          <Link href={`/@${author.name ?? ""}`}>
            <span>{`@${author.name ?? ""}`}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">
              {`· ${dayjs(post.createdAt).fromNow()}`}
            </span>
          </Link>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  );
};
