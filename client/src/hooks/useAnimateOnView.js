import { useEffect } from 'react';

export function useAnimateOnView(
  containerRef,
  selector,
  options = { threshold: 0.1 },
  animatedClass = 'animate-fadeInOpacity',
  deps = []
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(animatedClass);
          obs.unobserve(entry.target);
        }
      });
    }, options);

    const elements = Array.from(container.querySelectorAll(selector));
    elements.forEach((el) => {
      el.classList.remove(animatedClass);
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [
    containerRef,
    selector,
    options.threshold,
    animatedClass,
    ...deps,
  ]);
}
