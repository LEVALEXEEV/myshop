export const PlusIcon = ({ isOpen }) => (
  <span
    className={`transition-transform duration-200 origin-center ${
      isOpen ? 'rotate-45' : ''
    }`}
  >
    <span
      className="
        flex items-center justify-center w-4 h-4 md:w-8 md:h-8 rounded-full
        transition-colors duration-200
        group-hover:bg-[#b2b2b2]
        group-hover:cursor-pointer
      "
    >
      <svg
        className="t-store__tabs__close-icon"
        width="20px"
        height="20px"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          stroke="none"
          strokeWidth="1px"
          fill="none"
          fillRule="evenodd"
          strokeLinecap="square"
        >
          <g transform="translate(1.000000, 1.000000)" stroke="rgba(0,0,0,1)">
            <path d="M0,11 L22,11" />
            <path d="M11,0 L11,22" />
          </g>
        </g>
      </svg>
    </span>
  </span>
);
