import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    NotFoundException,
  } from '@nestjs/common';
  import { OrdersService } from './orders.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { CreateOrderDto } from './dto/create-order.dto';
  import { AcceptOrderDto } from './dto/accept-order.dto';
  import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
  import { OrderStatus } from '@prisma/client';
  import { PrismaService } from '../prisma/prisma.service';
  
  @Controller('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class OrdersController {
    constructor(
      private ordersService: OrdersService,
      private prisma: PrismaService,
    ) {}
  
    // CUSTOMER ENDPOINTS
    @Post()
    @Roles('CUSTOMER')
    async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
      // Get customer ID from user
      const customer = await this.ordersService['prisma'].customer.findUnique({
        where: { userId: req.user.sub },
        select: { id: true },
      });

      if (!customer) {
        throw new NotFoundException('Customer profile not found for this user.');
      }

      return this.ordersService.createOrder(customer.id, dto, req.user.sub);
    }
  
    @Get(':id')
    async getOrderById(@Request() req, @Param('id') orderId: string) {
      return this.ordersService.getOrderById(orderId, req.user.sub);
    }
  
    // RESTAURANT ENDPOINTS
    @Get('restaurant/active')
    @Roles('RESTAURANT')
    async getActiveOrders(@Request() req) {
      return this.ordersService.getActiveOrders(req.user.sub);
    }
  
    @Get('restaurant/all')
    @Roles('RESTAURANT')
    async getRestaurantOrders(
      @Request() req,
      @Query('status') status?: OrderStatus,
    ) {
      return this.ordersService.getRestaurantOrders(req.user.sub, status);
    }
  
    @Get('restaurant/history')
    @Roles('RESTAURANT')
    async getOrderHistory(
      @Request() req,
      @Query('page') page?: number,
      @Query('limit') limit?: number,
    ) {
      return this.ordersService.getOrderHistory(
        req.user.sub,
        page ? +page : 1,
        limit ? +limit : 20,
      );
    }
  
    @Post(':id/accept')
    @Roles('RESTAURANT')
    async acceptOrder(
      @Request() req,
      @Param('id') orderId: string,
      @Body() dto: AcceptOrderDto,
    ) {
      return this.ordersService.acceptOrder(req.user.sub, orderId, dto);
    }
  
    @Post(':id/reject')
    @Roles('RESTAURANT')
    async rejectOrder(@Request() req, @Param('id') orderId: string) {
      return this.ordersService.rejectOrder(req.user.sub, orderId);
    }
  
    @Post(':id/ready')
    @Roles('RESTAURANT')
    async markOrderReady(@Request() req, @Param('id') orderId: string) {
      return this.ordersService.markOrderReady(req.user.sub, orderId);
    }
  
    @Patch(':id/status')
    async updateOrderStatus(
      @Request() req,
      @Param('id') orderId: string,
      @Body() dto: UpdateOrderStatusDto,
    ) {
      return this.ordersService.updateOrderStatus(req.user.sub, orderId, dto);
    }
  }