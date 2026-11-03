import { appRoutes } from "@/modules/shared/lib/routes";
import Link from "next/link";

import { PagePlaceholder } from "@/modules/shared/components/page-placeholder";

export default function NotFound() {
  return (
    <PagePlaceholder
      eyebrow="404"
      title="This page wandered off"
      description="We couldn't find what you were looking for. Check the link on your invitation, or head back home."
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
