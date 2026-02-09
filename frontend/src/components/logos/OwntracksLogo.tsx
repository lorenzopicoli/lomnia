/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
export function OwntracksLogo(props: { width?: number; height?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48.000000 48.000000"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <metadata>{"\nCreated by potrace 1.16, written by Peter Selinger 2001-2019\n"}</metadata>
      <defs>
        <clipPath id="clip">
          <circle cx="24" cy="24" r="24" />
        </clipPath>
      </defs>

      <g clipPath="url(#clip)">
        <circle cx="24" cy="24" r="24" fill="#ffff" />
        <g transform="translate(0.000000,48.000000) scale(0.100000,-0.100000)" fill="#4271B0" stroke="none">
          <path d="M0 240 l0 -240 240 0 240 0 0 240 0 240 -240 0 -240 0 0 -240z m275 160 c25 0 74 -51 84 -86 6 -21 6 -46 0 -66 -10 -35 -104 -168 -118 -168 -14 0 -112 138 -121 170 -11 39 4 91 34 119 25 24 73 42 94 35 8 -2 20 -4 27 -4z" />

          <path d="M179 341 c-45 -45 -35 -111 22 -141 17 -10 19 -7 19 20 0 20 -5 30 -15 30 -8 0 -15 3 -15 6 0 12 42 74 49 74 4 0 20 -17 35 -37 25 -36 26 -38 6 -41 -15 -3 -20 -11 -20 -33 0 -26 2 -29 19 -19 29 15 51 51 51 83 0 40 -49 87 -90 87 -22 0 -41 -9 -61 -29z" />
        </g>
      </g>
    </svg>
  );
}
