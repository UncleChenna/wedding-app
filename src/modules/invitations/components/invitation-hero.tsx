import Image from "next/image";
import { stockHeroBlur, type InvitationHeroPhoto } from "../lib/hero-photo";

/** The editor can supply its saved photo metadata without changing the reserved layout. */
export function InvitationHero({ photo }: { photo?: InvitationHeroPhoto }) {
  const display = photo ?? {
    src: "/share/couple-placeholder.jpg",
    alt: "A couple holding hands in warm evening light",
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
    </figure>
  );
}
