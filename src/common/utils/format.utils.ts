export const formatExpiresIn = (value: string): string => {
  if (value.endsWith('h')) return `${value.replace('h', '')} giờ`;
  if (value.endsWith('m')) return `${value.replace('m', '')} phút`;
  if (value.endsWith('d')) return `${value.replace('d', '')} ngày`;
  return value;
};
