export const calculateAge = (birthdate: string): number => {
  const today = new Date();
  const birth = new Date(birthdate);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  // If birthday hasn't occurred this year, subtract 1 from age
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const formatBirthdateWithAge = (birthdate: string): string => {
  const age = calculateAge(birthdate);
  const formattedDate = new Date(birthdate).toLocaleDateString('ja-JP');
  return `${formattedDate} (${age}歳)`;
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && !!dateString.match(/^\d{4}-\d{2}-\d{2}$/);
};