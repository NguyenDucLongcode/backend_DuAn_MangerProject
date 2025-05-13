import { toEmptyStringAsUndefined } from '@/common/utils/transform.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  // valide senderId
  @IsNotEmpty({ message: 'SenderId không được để trống' })
  @IsString({ message: 'SenderId phải là một chuỗi văn bản' })
  senderId!: string;

  // validate receiverID
  @IsNotEmpty({ message: 'ReceiverID không được để trống' })
  @IsString({ message: 'ReceiverID phải là một chuỗi văn bản' })
  receiverId!: string;

  // validate groupId
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'GroupId phải là một chuỗi văn bản' })
  groupId?: string;

  //validate visibility
  @IsNotEmpty({ message: 'Content không được để trống' })
  @IsString({ message: 'Content phải là một chuỗi văn bản' })
  content!: string;
}
