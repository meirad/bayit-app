const getAdminEmails = () => {
  const configured = process.env.ADMIN_EMAILS || 'foreverram03@gmail.com';
  return configured
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

const resolveUserRole = (email, storedRole) => {
  const normalized = String(email || '').toLowerCase();
  if (getAdminEmails().includes(normalized)) return 'admin';
  return storedRole || 'editor';
};

const isAdminRole = (role) => role === 'admin';

module.exports = {
  getAdminEmails,
  resolveUserRole,
  isAdminRole
};
