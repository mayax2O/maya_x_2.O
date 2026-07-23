import type { Testimonial } from "../../lib/types";

// Component: Testimonials grid — client quotes shown on the home page.
export function Testimonials({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
      {testimonials.map((testimonial) => (
        <li key={testimonial.id}>
          <figure className="flex h-full flex-col justify-between rounded-lg bg-porcelain p-6 ring-1 ring-ink/5">
            <div>
              <div
                className="flex gap-0.5 text-brass-deep"
                aria-label={`${testimonial.rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <svg
                    key={index}
                    viewBox="0 0 24 24"
                    fill={index < testimonial.rating ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M12 3l2.6 5.7 6.2.6-4.7 4.2 1.4 6.1L12 16.7 6.5 19.6l1.4-6.1-4.7-4.2 6.2-.6z" />
                  </svg>
                ))}
              </div>
              <blockquote className="mt-4 text-[15px] leading-relaxed text-ink/85">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
            </div>
            <figcaption className="mt-6 text-[13.5px] text-slate">
              <span className="font-semibold text-ink">
                {testimonial.authorName}
              </span>
              {" · "}
              {testimonial.authorRole}, {testimonial.city}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
