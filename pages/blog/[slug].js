import { useEffect } from "react";
import { useRouter } from "next/router";
import BlogPage from "../index";

export default function BlogSlugPage() {
  const router = useRouter();

  // Redirect to the index page with slug as query parameter
  useEffect(() => {
    if (router.isReady) {
      const { slug } = router.query;
      router.replace(`/blog?slug=${slug}`);
    }
  }, [router.isReady]);

  return <BlogPage />;
}
