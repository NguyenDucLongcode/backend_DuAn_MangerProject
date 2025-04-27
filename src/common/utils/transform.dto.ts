import { Transform } from 'class-transformer';

export const toBool = () =>
  Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  });

export const toEmptyStringAsUndefined = () =>
  Transform(({ value }): unknown => {
    return value === '' ? undefined : value;
  });

export const toInt = () =>
  Transform(({ value }: { value: unknown }) => {
    // Ép value sang string để đảm bảo an toàn khi truyền vào parseInt
    const num = parseInt(String(value), 10);

    // Nếu không phải số hợp lệ (NaN) hoặc nhỏ hơn 1, trả về mặc định là 1
    return isNaN(num) || num < 1 ? 1 : num;
  });

export const toIntOrUndefined = () =>
  Transform(({ value }) => {
    if (value === '') return undefined;
    const num = parseInt(String(value), 10);
    return isNaN(num) ? undefined : num;
  });
