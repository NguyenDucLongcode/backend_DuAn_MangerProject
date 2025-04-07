import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

const toInt = () =>
  Transform(({ value }: { value: unknown }) => {
    // Ép value sang string để đảm bảo an toàn khi truyền vào parseInt
    const num = parseInt(String(value), 10);

    // Nếu không phải số hợp lệ (NaN) hoặc nhỏ hơn 1, trả về mặc định là 1
    return isNaN(num) || num < 1 ? 1 : num;
  });

export class PaginationDto {
  @IsOptional()
  @toInt()
  @IsInt({ message: 'Limit phải là một số nguyên' })
  @Min(1, { message: 'Limit phải lớn hơn hoặc bằng 1' })
  @Max(100, { message: 'Limit tối đa là 100' })
  limit: number = 5;

  @IsOptional()
  @toInt()
  @IsInt({ message: 'Page phải là một số nguyên' })
  @Min(1, { message: 'Page phải lớn hơn hoặc bằng 1' })
  page: number = 1;
}
