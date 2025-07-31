"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ArticleDetail() {
  const params = useParams();
  const { id } = params;

  const { data, error, isLoading } = useSWR(id ? `/api/public-article/${id}` : null, fetcher);
  const article = data?.article;

  useEffect(() => {
    if (id) {
      fetch(`/api/views`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: id }),
      });
    }
  }, [id]);

  if (isLoading) return <div className="p-8 text-center">Loading article...</div>;
  if (error || !article) return <div className="p-8 text-center text-red-600">Failed to load article.</div>;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
      <div className="text-gray-500 text-sm mb-6">By {article.authorName || "Unknown"} &middot; {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Draft"} &middot; {article.views} views</div>
      <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
    </div>
  );
}
