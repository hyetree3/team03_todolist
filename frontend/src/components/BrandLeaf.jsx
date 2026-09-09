export default function BrandLeaf({ className = '' }) {
  return (
    <svg className={`brand-leaf-icon ${className}`.trim()} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#416b4d" />
      <path d="M5.4 28C6 19.2 8.9 12.2 15.1 8.8c4.9-2.7 9-2.8 12.7-6.1.5 10.8-2.2 18.5-8.6 22.1-4.2 2.4-8.8 1.7-13.8 3.2Z" fill="#fffdf3" />
      <path d="M6.8 26.8c3.8-6.6 8.8-11.5 15.3-14.7-5.2 4.3-9.5 9.4-12.6 15.6Z" fill="#416b4d" />
    </svg>
  )
}
