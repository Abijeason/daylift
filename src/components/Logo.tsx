// A weight plate rising over a barbell like the sun: day plus lift.
export function Logo({ size }: { size?: number }) {
  return (
    <svg className="logo-mark" viewBox="0 0 200 116" width={size} aria-hidden="true">
      <defs>
        <clipPath id="logo-sky"><rect width="200" height="96" /></clipPath>
      </defs>
      <g clipPath="url(#logo-sky)">
        <g className="logo-sun">
          <g className="logo-plate">
            <circle className="logo-disc" cx="100" cy="96" r="78" />
            <circle className="logo-groove" cx="100" cy="96" r="60" />
            <circle className="logo-hole" cx="100" cy="96" r="16" />
            {[0, 60, 120, 180, 240, 300].map(a => (
              <rect key={a} className="logo-grip" x="96" y="34" width="8" height="20" rx="2" transform={`rotate(${a} 100 96)`} />
            ))}
          </g>
        </g>
      </g>
      <g className="logo-bar">
        <rect x="0" y="99" width="200" height="8" />
        <rect x="8" y="93" width="10" height="20" />
        <rect x="182" y="93" width="10" height="20" />
      </g>
    </svg>
  )
}
