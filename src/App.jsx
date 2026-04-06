import { useState } from "react";
import FeedPage from "./pages/FeedPage.jsx";
import PostPage from "./pages/PostPage.jsx";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  const [page, setPage] = useState("feed"); // "feed" | "post"

  return (
    <>
      {page === "post"
        ? <PostPage onBack={() => setPage("feed")} />
        : <FeedPage onPostClick={() => setPage("post")} />
      }
      <Analytics />
    </>
  );
}