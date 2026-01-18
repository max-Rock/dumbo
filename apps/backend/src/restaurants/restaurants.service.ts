import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { ToggleStatusDto } from './dto/toggle-status.dto';
import { OperatingHoursDto } from './dto/operating-hours.dto';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async getRestaurantByUserId(userId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { userId },
      include: {
        hours: {
          orderBy: { dayOfWeek: 'asc' },
        },
        holidays: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async getRestaurantById(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        hours: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async updateRestaurant(userId: string, dto: UpdateRestaurantDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { userId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return this.prisma.restaurant.update({
      where: { id: restaurant.id },
      data: dto,
    });
  }

  async toggleStatus(userId: string, dto: ToggleStatusDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { userId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return this.prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { isOpen: dto.isOpen },
    });
  }

  async setOperatingHours(userId: string, hours: OperatingHoursDto[]) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { userId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Delete existing hours
    await this.prisma.restaurantHours.deleteMany({
      where: { restaurantId: restaurant.id },
    });

    // Create new hours
    const createdHours = await this.prisma.restaurantHours.createMany({
      data: hours.map((hour) => ({
        restaurantId: restaurant.id,
        ...hour,
      })),
    });

    return createdHours;
  }

  async getTodayEarnings(userId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { userId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const earnings = await this.prisma.restaurantEarning.aggregate({
      where: {
        restaurantId: restaurant.id,
        createdAt: {
          gte: today,
        },
      },
      _sum: {
        netAmount: true,
      },
      _count: true,
    });

    return {
      totalEarnings: earnings._sum.netAmount || 0,
      orderCount: earnings._count,
    };
  }
}