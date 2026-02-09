export const sanitizeUser = (user: any) => {
  const { password, passwordHash, phoneNumber, ...userWithoutSensitiveData } = user;
  
  const sanitized: any = {
    ...userWithoutSensitiveData
  };
  
  if (phoneNumber && typeof phoneNumber === 'string' && phoneNumber.length >= 4) {
    sanitized.phoneSuffix = phoneNumber.slice(-4);
  }
  
  return sanitized;
};