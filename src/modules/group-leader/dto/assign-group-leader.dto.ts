import { IsNotEmpty, IsString } from 'class-validator';

export class AssignGroupLeaderDto {
  // validate GroupId
  @IsNotEmpty({ message: 'GroupId không được để trống' })
  @IsString({ message: 'GroupId phải là 1 chuỗi' })
  groupId!: string;

  // validate userId
  @IsNotEmpty({ message: 'UserId không được để trống' })
  @IsString({ message: 'UserId phải là 1 chuỗi' })
  userId!: string;
}
