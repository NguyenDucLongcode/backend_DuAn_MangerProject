import * as bcrypt from 'bcrypt'; // bcrypt

// delete password field in user avoid sending password to client
export function removePassword(user: object) {
  const { password, ...safeUser } = user as Record<string, any>;
  void password;
  return safeUser;
}

//function to hash the user password to save it in the database
const saltRounds = 10;
export const hashPasswordHelper = async (
  plainPassword: string,
): Promise<string> => {
  try {
    return await bcrypt.hash(plainPassword, saltRounds);
  } catch (err) {
    console.error('Hashing error:', err);
    throw new Error('Failed to hash password');
  }
};

//function to compare user password with password in database
export const comparePasswordHelper = async (
  plainPassword: string,
  hashedPassword: string | undefined,
): Promise<boolean> => {
  if (!hashedPassword) {
    console.error('Không có mật khẩu đã mã hóa để so sánh');
    throw new Error('Mật khẩu chưa được mã hóa hoặc không hợp lệ');
  }
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (err) {
    console.error('Lỗi so sánh mật khẩu:', err);
    throw new Error('So sánh mật khẩu thất bại');
  }
};
