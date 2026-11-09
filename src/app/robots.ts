import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOW } from "@/modules/shared/lib/search-privacy";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...ROBOTS_DISALLOW] },
  };
}
