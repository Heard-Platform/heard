export function Mailbox() {
  return (
    <svg
      width="64"
      height="56"
      viewBox="0 0 64 56"
      aria-hidden="true"
    >
      <rect
        className="mailbox-post"
        x="27"
        y="36"
        width="8"
        height="20"
        rx="2"
      />
      <path
        className="mailbox-body"
        d="M6 40 V 22 C 6 12, 14 6, 24 6 H 42 C 52 6, 58 14, 58 22 V 40 Z"
      />
      <path
        className="mailbox-body-shade"
        d="M6 40 V 22 C 6 12, 14 6, 24 6 C 33 6, 40 13, 40 22 V 40 Z"
      />
      <ellipse
        className="mailbox-opening"
        cx="23"
        cy="25"
        rx="9"
        ry="10"
      />
      <rect
        className="mailbox-flag-pole"
        x="50"
        y="2"
        width="3.5"
        height="24"
        rx="1.5"
      />
      <path className="mailbox-flag" d="M53.5 2 H 63 V 11 H 53.5 Z" />
    </svg>
  );
}
