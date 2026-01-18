import { Controller, Get, Patch, Body, UseGuards, Request, Post } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { ToggleStatusDto } from './dto/toggle-status.dto';
import { OperatingHoursDto } from './dto/operating-hours.dto';

@Controller('restaurants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RestaurantsController {
  constructor(private restaurantsService: RestaurantsService) {}

  @Get('me')
  @Roles('RESTAURANT')
  async getMyRestaurant(@Request() req) {
    return this.restaurantsService.getRestaurantByUserId(req.user.sub);
  }

  @Patch('me')
  @Roles('RESTAURANT')
  async updateMyRestaurant(@Request() req, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantsService.updateRestaurant(req.user.sub, dto);
  }

  @Post('me/toggle-status')
  @Roles('RESTAURANT')
  async toggleStatus(@Request() req, @Body() dto: ToggleStatusDto) {
    return this.restaurantsService.toggleStatus(req.user.sub, dto);
  }

  @Post('me/hours')
  @Roles('RESTAURANT')
  async setOperatingHours(@Request() req, @Body() hours: OperatingHoursDto[]) {
    return this.restaurantsService.setOperatingHours(req.user.sub, hours);
  }

  @Get('me/earnings/today')
  @Roles('RESTAURANT')
  async getTodayEarnings(@Request() req) {
    return this.restaurantsService.getTodayEarnings(req.user.sub);
  }
}