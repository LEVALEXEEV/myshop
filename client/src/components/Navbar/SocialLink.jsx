import React from 'react';

export const SocialLink = React.memo(({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="hover:underline"
  >
    {children}
  </a>
));
