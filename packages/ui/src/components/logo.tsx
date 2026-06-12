export function Logo(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-[oklch(0.42_0.16_230)]"
      {...props}
    >
      <path
        d="M24 4.5 42.5 18v18.5L31 43.5H17L5.5 36.5V18L24 4.5Z"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M8 20.5 20.5 31h7L40 20.5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 15.5h17v19L24 41l-8.5-6.5v-19Z"
        fill="var(--background)"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M20 23.5h8M20 29h6"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
