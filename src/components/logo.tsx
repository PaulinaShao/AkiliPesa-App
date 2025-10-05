import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width="1em"
      height="1em"
      {...props}
    >
      <g fill="currentColor">
        <path d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88Z" />
        <path d="M172.4 76.51A40 40 0 0 0 132 68.17v81.5a40 40 0 0 0 40.4-39.17a39.77 39.77 0 0 0-33.56-39.67l31.28-31.28a8 8 0 0 0-11.32-11.32ZM156 110.49a24 24 0 1 1-24-24a24 24 0 0 1 24 24Z" />
      </g>
    </svg>
  );
}
