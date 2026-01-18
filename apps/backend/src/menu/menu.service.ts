import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { ToggleAvailabilityDto } from './dto/toggle-availability.dto';
import { CreateAddonDto } from './dto/create-addon.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // Get restaurant ID from user ID
  private async getRestaurantId(userId: string): Promise<string> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant.id;
  }

  // Verify menu item belongs to restaurant
  private async verifyMenuItemOwnership(menuItemId: string, restaurantId: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: { restaurantId: true },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    if (menuItem.restaurantId !== restaurantId) {
      throw new ForbiddenException('You do not own this menu item');
    }
  }

  // CATEGORIES
  async getCategories(userId: string) {
    const restaurantId = await this.getRestaurantId(userId);
    return this.prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createCategory(userId: string, dto: CreateCategoryDto) {
    const restaurantId = await this.getRestaurantId(userId);
    return this.prisma.menuCategory.create({
      data: {
        restaurantId,
        ...dto,
      },
    });
  }

  async deleteCategory(userId: string, categoryId: string) {
    const restaurantId = await this.getRestaurantId(userId);

    const category = await this.prisma.menuCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.restaurantId !== restaurantId) {
      throw new ForbiddenException('Category not found or access denied');
    }

    return this.prisma.menuCategory.delete({
      where: { id: categoryId },
    });
  }

  // MENU ITEMS
  async getMenuItems(userId: string) {
    const restaurantId = await this.getRestaurantId(userId);
    return this.prisma.menuItem.findMany({
      where: { restaurantId },
      include: {
        category: true,
        addons: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMenuItemById(userId: string, menuItemId: string) {
    const restaurantId = await this.getRestaurantId(userId);
    await this.verifyMenuItemOwnership(menuItemId, restaurantId);

    return this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        category: true,
        addons: true,
      },
    });
  }

  async createMenuItem(userId: string, dto: CreateMenuItemDto) {
    const restaurantId = await this.getRestaurantId(userId);

    return this.prisma.menuItem.create({
      data: {
        restaurantId,
        ...dto,
      },
      include: {
        category: true,
        addons: true,
      },
    });
  }

  async updateMenuItem(userId: string, menuItemId: string, dto: UpdateMenuItemDto) {
    const restaurantId = await this.getRestaurantId(userId);
    await this.verifyMenuItemOwnership(menuItemId, restaurantId);

    return this.prisma.menuItem.update({
      where: { id: menuItemId },
      data: dto,
      include: {
        category: true,
        addons: true,
      },
    });
  }

  async toggleAvailability(userId: string, menuItemId: string, dto: ToggleAvailabilityDto) {
    const restaurantId = await this.getRestaurantId(userId);
    await this.verifyMenuItemOwnership(menuItemId, restaurantId);

    return this.prisma.menuItem.update({
      where: { id: menuItemId },
      data: { isAvailable: dto.isAvailable },
    });
  }

  async deleteMenuItem(userId: string, menuItemId: string) {
    const restaurantId = await this.getRestaurantId(userId);
    await this.verifyMenuItemOwnership(menuItemId, restaurantId);

    return this.prisma.menuItem.delete({
      where: { id: menuItemId },
    });
  }

  // ADD-ONS
  async getAddons(userId: string, menuItemId: string) {
    const restaurantId = await this.getRestaurantId(userId);
    await this.verifyMenuItemOwnership(menuItemId, restaurantId);

    return this.prisma.menuItemAddon.findMany({
      where: { menuItemId },
    });
  }

  async createAddon(userId: string, menuItemId: string, dto: CreateAddonDto) {
    const restaurantId = await this.getRestaurantId(userId);
    await this.verifyMenuItemOwnership(menuItemId, restaurantId);

    return this.prisma.menuItemAddon.create({
      data: {
        menuItemId,
        ...dto,
      },
    });
  }

  async updateAddon(userId: string, addonId: string, dto: Partial<CreateAddonDto>) {
    const restaurantId = await this.getRestaurantId(userId);

    const addon = await this.prisma.menuItemAddon.findUnique({
      where: { id: addonId },
      include: { menuItem: true },
    });

    if (!addon || addon.menuItem.restaurantId !== restaurantId) {
      throw new ForbiddenException('Add-on not found or access denied');
    }

    return this.prisma.menuItemAddon.update({
      where: { id: addonId },
      data: dto,
    });
  }

  async deleteAddon(userId: string, addonId: string) {
    const restaurantId = await this.getRestaurantId(userId);

    const addon = await this.prisma.menuItemAddon.findUnique({
      where: { id: addonId },
      include: { menuItem: true },
    });

    if (!addon || addon.menuItem.restaurantId !== restaurantId) {
      throw new ForbiddenException('Add-on not found or access denied');
    }

    return this.prisma.menuItemAddon.delete({
      where: { id: addonId },
    });
  }

  // POPULAR ITEMS (for insights)
  async getPopularItems(userId: string) {
    const restaurantId = await this.getRestaurantId(userId);

    return this.prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: { totalOrders: 'desc' },
      take: 10,
      include: {
        category: true,
      },
    });
  }
}