import Image from "next/image";
import { stockHeroBlur, type InvitationHeroPhoto } from "../lib/hero-photo";

/** The editor can supply its saved photo metadata without changing the reserved layout. */
export function InvitationHero({ photo }: { photo?: InvitationHeroPhoto }) {
  const display = photo ?? {
    src: "/share/couple-placeholder.jpg",
    alt: "A couple holding hands in warm evening light; stock photograph",
    blurDataURL: stockHeroBlur,
  };
  return (
    <figure className="w-full" data-invitation-hero>
      <div className="relative aspect-[4/5] w-full overflow-hidden md:aspect-[4/3] lg:aspect-[16/9]">
        <Image
          src={display.src}
          alt={display.alt}
          fill
          sizes="100vw"
          placeholder="blur"
          blurDataURL={display.blurDataURL}
          loading="eager"
          fetchPriority="high"
          className="object-cover object-top"
        />
      </div>
      {!photo && (
        <figcaption className="grid gap-y-1 px-6 py-4 text-base leading-relaxed md:px-12">
          <span>Sample photograph</span>
          <a
            href="https://unsplash.com/photos/a-bride-and-groom-holding-hands-and-smiling-glouLzM1PMg"
            className="inline-flex min-h-11 w-fit items-center text-primary underline underline-offset-4"
            rel="noreferrer"
          >
            Lauren Mitchell / Unsplash
          </a>
        </figcaption>
      )}
    </figure>
  );
}
