export function Logo(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Outer diamond envelope */}
      <path
        d="M24 3.5 L44.5 24 L24 44.5 L3.5 24 Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Document sheet with folded corner */}
      <path
        d="M17 12.5 H27 L31 16.5 V31 H17 Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M27 12.5 V16.5 H31"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Text lines */}
      <path
        d="M21 21.5 H27"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M21 25.5 H25"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Envelope fold */}
      <path
        d="M9.5 28 L24 38.5 L38.5 28"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
