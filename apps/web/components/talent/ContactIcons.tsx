// Only Mobile/WhatsApp ever leave the API for a public profile — and even
// those never render as visible text here, only as the target of a tel:/
// wa.me link behind an icon button, per the "numbers stay hidden" call.
export function ContactIcons({
  mobile,
  whatsapp,
  className,
}: {
  mobile: string | null;
  whatsapp: string | null;
  className?: string;
}) {
  if (!mobile && !whatsapp) return null;

  return (
    <div
      className={["flex items-center gap-2", className]
        .filter(Boolean)
        .join(" ")}
    >
      {mobile ? (
        <a
          href={`tel:${mobile.trim()}`}
          aria-label="Call"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sm transition hover:brightness-110"
        >
          <PhoneIcon />
        </a>
      ) : null}
      {whatsapp ? (
        <a
          href={`https://wa.me/${toWaDigits(whatsapp)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition hover:brightness-110"
        >
          <WhatsAppIcon />
        </a>
      ) : null}
    </div>
  );
}

function toWaDigits(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
      <path d="M16.7 14.1c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.2-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.4c.1-.2.2-.3.2-.4.1-.2 0-.4 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 2 3 4.7 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.7 1.9-1.3.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}
