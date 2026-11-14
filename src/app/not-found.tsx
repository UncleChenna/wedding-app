import { appRoutes } from "@/modules/shared/lib/routes";
import Link from "next/link";

import { PagePlaceholder } from "@/modules/shared/components/page-placeholder";

export default function NotFound() {
  return (
    <PagePlaceholder
      eyebrow="404"
      title={
        // A fixed break keeps the heading from re-wrapping when the display font arrives.
        <>
          This page <span className="block">wandered off</span>
        </>
      }
      description={
        <>
          <span className="block">Check the link on your invitation,</span>
          <span className="block">or head back home.</span>
        </>
      }
      backTo={null}
      className="min-h-dvh"
    >
      <Link
        href={appRoutes.home.path}
        className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
      >
        Back to home
      </Link>
    </PagePlaceholder>
  );
}
