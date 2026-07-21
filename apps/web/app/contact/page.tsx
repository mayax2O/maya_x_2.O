import type { Metadata } from "next";

import { Container } from "../../components/layout/Container";
import { ContactForm } from "../../components/forms/ContactForm";
import { MediaFrame } from "../../components/media/MediaFrame";

export const metadata: Metadata = {
  title: "Contact | MAYA_X",
  description:
    "Get in touch with the MAYA_X agency team, headquartered in Kolkata.",
};

export default function ContactPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-[13px] font-semibold uppercase tracking-widest text-brass-deep">
          Contact
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Talk to our team
        </h1>
        <p className="mt-3 text-[15.5px] text-slate">
          Questions about a booking, membership, or joining the roster as talent
          — reach out and we&apos;ll respond within one business day.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <ContactForm />
        </div>

        <div>
          <MediaFrame
            src="/mock/contact/office.jpg"
            alt="MAYA_X office in Kolkata"
            aspect="wide"
          />
          <dl className="mt-6 flex flex-col gap-4 text-[14.5px]">
            <div>
              <dt className="font-semibold text-ink">Head office</dt>
              <dd className="text-slate">
                Park Street, Kolkata, West Bengal 700016, India
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Email</dt>
              <dd className="text-slate">hello@mayax.example</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Phone</dt>
              <dd className="text-slate">+91 33 4000 1234</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Hours</dt>
              <dd className="text-slate">
                Monday – Saturday, 10:00 – 19:00 IST
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Container>
  );
}
