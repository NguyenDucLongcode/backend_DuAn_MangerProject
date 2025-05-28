import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ReviewService } from './review.service';

//DTO
import { CreateReviewDto, UpdateReviewDto, PaginationReviewDto } from './dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/enums/role.enum';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/types/jwt-payload.interface';
import { checkPermission } from '@/common/utils/role/auth-utils';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Roles(Role.ADMIN, Role.LEADER, Role.CODER, Role.CUSTOMER)
  @Post('create')
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.createReview(createReviewDto);
  }

  @Roles(Role.ADMIN, Role.LEADER)
  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationReviewDto) {
    return this.reviewService.Pagination(paginationDto);
  }

  @Get()
  async findOne(
    @Query('reviewId') reviewId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    /**
     * Kiểm tra quyền truy cập với role và id
     * @param user Thông tin user hiện tại (jwt payload)
     * @param userId Id của đối tượng đang ứng vơi review trong DB
     * @param allowedRoles Các role được phép thao tác không cần so sánh id
     * @param checkOwnUser Nếu true, user chỉ được thao tác với chính mình nếu không thuộc allowedRoles
     */
    const isReview = await this.reviewService.isReviewOfUser(reviewId, user.id);
    checkPermission(user, isReview, [Role.ADMIN, Role.LEADER]);

    return this.reviewService.findOne(reviewId);
  }

  @Patch('update')
  async update(
    @Query('reviewId') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Kiểm tra quyền truy cập với role và id
    const isReview = await this.reviewService.isReviewOfUser(reviewId, user.id);
    checkPermission(user, isReview, [Role.ADMIN, Role.LEADER]);

    return this.reviewService.updateReview(reviewId, updateReviewDto);
  }

  @Delete('delete')
  async remove(
    @Query('reviewId') reviewId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    // Kiểm tra quyền truy cập với role và id
    const isReview = await this.reviewService.isReviewOfUser(reviewId, user.id);
    checkPermission(user, isReview, [Role.ADMIN, Role.LEADER]);

    return this.reviewService.removeReview(reviewId);
  }
}
