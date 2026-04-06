import { useState } from "react";
import FeedPage from "./pages/FeedPage.jsx";
import PostPage from "./pages/PostPage.jsx";

export default function App() {
  const [page, setPage] = useState("feed"); // "feed" | "post"

  if (page === "post") {
    return <PostPage onBack={() => setPage("feed")} />;
  }

  return <FeedPage onPostClick={() => setPage("post")} />;
}