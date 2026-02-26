import { scrollOrNavigate } from './scrollHelpers';

export const createRenderLink =
  (location, navigate, scrollContainerRef, callbacks) =>
  ({ label, target, path, disabled }) => {
    if (disabled) {
      return (
        <span key={label} className="cursor-auto select-none opacity-50">
          {label}
        </span>
      );
    }

    const handle = () => {
      if (target) {
        scrollOrNavigate({ location, navigate, target, callbacks });
      } else if (path) {
        navigate(path);
        setTimeout(() => {
          const container = scrollContainerRef?.current ?? window;
          container.scrollTo({ top: 0, behavior: 'smooth' });
        }, 0);
      }
    };

    return (
      <span
        key={label}
        onClick={handle}
        className="cursor-pointer hover:text-[#c2c2c2] transition-all duration-250"
      >
        {label}
      </span>
    );
  };

export const renderExternalLink = ({ label, href }) => (
  <a
    key={label}
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-[#c2c2c2] uppercase transition-all duration-250"
  >
    {label}
  </a>
);
