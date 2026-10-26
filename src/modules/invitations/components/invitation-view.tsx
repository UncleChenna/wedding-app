import Image from "next/image";
import Link from "next/link";
import celebration from "../assets/celebration.webp";

export interface InvitationDetails {
  names: readonly [string, string];
  date: string;
  time: string;
  venue: string;
  address: string;
  dressCode: string;
}

export function InvitationView({ details }: { details: InvitationDetails }) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:px-12">
      <p className="mb-8 text-base leading-relaxed">
        Invitation preview · sample photograph and venue details
      </p>
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <Image
          src={celebration}
          loading="eager"
          fetchPriority="high"
          alt="A wedding couple holding a bouquet in warm afternoon light; sample photograph"
          placeholder="blur"
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[4/5] w-full object-cover"
        />
        <section className="min-w-0">
          <p className="mb-6 text-base tracking-widest text-primary uppercase">
            Together with our families
          </p>
          <h1 className="font-display text-5xl leading-tight tracking-tight wrap-anywhere md:text-7xl">
            {details.names[0]} <span className="block text-primary">&amp;</span>
            {details.names[1]}
          </h1>
          <p className="mt-8 font-display text-3xl leading-tight">
            Two stories. One ending: forever.
          </p>
          <p className="mt-6 max-w-prose text-lg leading-relaxed">
            You&apos;ve been part of our story. Come and see the best chapter yet.
          </p>
          <dl className="mt-12 space-y-6 text-base leading-relaxed">
            <div>
              <dt className="text-primary">The day</dt>
              <dd>
                {details.date}
                <br />
                {details.time}
              </dd>
            </div>
            <div>
              <dt className="text-primary">The place</dt>
              <dd>
                {details.venue}
                <br />
                {details.address}
              </dd>
            </div>
            <div>
              <dt className="text-primary">Dress code</dt>
              <dd>{details.dressCode}</dd>
            </div>
          </dl>
          <a
            className="mt-6 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${details.venue}, ${details.address}`)}`}
          >
            View the venue
          </a>
          <div className="mt-8">
            <a
              href="#rsvp"
              className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
            >
              About your RSVP
            </a>
          </div>
        </section>
      </div>
      <section id="rsvp" className="mx-auto max-w-prose py-16 text-center">
        <h2 className="font-display text-4xl">A seat at our celebration</h2>
        <p className="mt-6 text-lg leading-relaxed">
          This preview does not send an RSVP. Your personal invitation will let you reply when
          invitations are ready.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
          href="/dev"
        >
          Back to previews
        </Link>
      </section>
    </main>
  );
}
