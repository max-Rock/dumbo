import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
  } from '@nestjs/common';
  import { MenuService } from './menu.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { CreateMenuItemDto } from './dto/create-menu-item.dto';
  import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
  import { ToggleAvailabilityDto } from './dto/toggle-availability.dto';
  import { CreateAddonDto } from './dto/create-addon.dto';
  import { CreateCategoryDto } from './dto/create-category.dto';
  
  @Controller('menu')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RESTAURANT')
  export class MenuController {
    constructor(private menuService: MenuService) {}
  
    // CATEGORIES
    @Get('categories')
    async getCategories(@Request() req) {
      return this.menuService.getCategories(req.user.sub);
    }
  
    @Post('categories')
    async createCategory(@Request() req, @Body() dto: CreateCategoryDto) {
      return this.menuService.createCategory(req.user.sub, dto);
    }
  
    @Delete('categories/:id')
    async deleteCategory(@Request() req, @Param('id') categoryId: string) {
      return this.menuService.deleteCategory(req.user.sub, categoryId);
    }
  
    // MENU ITEMS
    @Get('items')
    async getMenuItems(@Request() req) {
      return this.menuService.getMenuItems(req.user.sub);
    }
  
    @Get('items/:id')
    async getMenuItemById(@Request() req, @Param('id') menuItemId: string) {
      return this.menuService.getMenuItemById(req.user.sub, menuItemId);
    }
  
    @Post('items')
    async createMenuItem(@Request() req, @Body() dto: CreateMenuItemDto) {
      return this.menuService.createMenuItem(req.user.sub, dto);
    }
  
    @Patch('items/:id')
    async updateMenuItem(
      @Request() req,
      @Param('id') menuItemId: string,
      @Body() dto: UpdateMenuItemDto,
    ) {
      return this.menuService.updateMenuItem(req.user.sub, menuItemId, dto);
    }
  
    @Patch('items/:id/toggle-availability')
    async toggleAvailability(
      @Request() req,
      @Param('id') menuItemId: string,
      @Body() dto: ToggleAvailabilityDto,
    ) {
      return this.menuService.toggleAvailability(req.user.sub, menuItemId, dto);
    }
  
    @Delete('items/:id')
    async deleteMenuItem(@Request() req, @Param('id') menuItemId: string) {
      return this.menuService.deleteMenuItem(req.user.sub, menuItemId);
    }
  
    // ADD-ONS
    @Get('items/:id/addons')
    async getAddons(@Request() req, @Param('id') menuItemId: string) {
      return this.menuService.getAddons(req.user.sub, menuItemId);
    }
  
    @Post('items/:id/addons')
    async createAddon(
      @Request() req,
      @Param('id') menuItemId: string,
      @Body() dto: CreateAddonDto,
    ) {
      return this.menuService.createAddon(req.user.sub, menuItemId, dto);
    }
  
    @Patch('addons/:id')
    async updateAddon(
      @Request() req,
      @Param('id') addonId: string,
      @Body() dto: Partial<CreateAddonDto>,
    ) {
      return this.menuService.updateAddon(req.user.sub, addonId, dto);
    }
  
    @Delete('addons/:id')
    async deleteAddon(@Request() req, @Param('id') addonId: string) {
      return this.menuService.deleteAddon(req.user.sub, addonId);
    }
  
    // INSIGHTS
    @Get('popular-items')
    async getPopularItems(@Request() req) {
      return this.menuService.getPopularItems(req.user.sub);
    }
  }