export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const isValidPhone = (phone) =>
  /^\d{11,15}$/.test(phone.replace(/\D/g, ''));
