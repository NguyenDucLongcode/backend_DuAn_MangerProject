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

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('create')
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.createReview(createReviewDto);
  }

  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationReviewDto) {
    return this.reviewService.Pagination(paginationDto);
  }

  @Get()
  findOne(@Query('reviewId') reviewId: string) {
    return this.reviewService.findOne(reviewId);
  }

  @Patch('update')
  update(
    @Query('reviewId') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewService.updateReview(reviewId, updateReviewDto);
  }

  @Delete('delete')
  remove(@Query('reviewId') reviewId: string) {
    return this.reviewService.removeReview(reviewId);
  }
}
