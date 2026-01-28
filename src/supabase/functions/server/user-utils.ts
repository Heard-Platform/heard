export const sanitizeUser = (user: any) => {
  const { password, passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
