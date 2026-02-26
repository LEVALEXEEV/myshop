export const navigateAndScrollTop = (navigate, path, containerRef) => {
  navigate(path);
  const container = containerRef?.current ?? window;
  container.scrollTo({ top: 0, behavior: 'smooth' });
};

export const scrollOrNavigate = ({ location, navigate, target, callbacks }) => {
  if (location.pathname === '/') {
    callbacks[target]?.();
  } else {
    navigate(`/?scrollTarget=${target}`);
    setTimeout(
      () =>
        window.dispatchEvent(
          new CustomEvent('scrollToSection', { detail: target })
        ),
      500
    );
  }
};
