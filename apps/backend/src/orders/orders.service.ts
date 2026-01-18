import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AcceptOrderDto } from './dto/accept-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // Generate unique order number
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `ORD-${timestamp}${random}`.toUpperCase();
  }

  // CREATE ORDER (Customer)
  async createOrder(customerId: string, dto: CreateOrderDto) {
    const orderNumber = this.generateOrderNumber();

    // Calculate platform fee and tax
    const platformFee = dto.subtotal * 0.05; // 5% platform fee
    const tax = dto.subtotal * 0.05; // 5% GST

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId,
        restaurantId: dto.restaurantId,
        items: dto.items as any,
        subtotal: dto.subtotal,
        deliveryFee: dto.deliveryFee,
        platformFee,
        tax,
        total: dto.total,
        deliveryAddress: dto.deliveryAddress as any,
        paymentMethod: dto.paymentMethod,
        customerNotes: dto.customerNotes,
        status: 'PENDING',
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            phone: true,
            averagePrepTime: true,
          },
        },
        customer: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // Create status history
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'PENDING',
        changedBy: customerId,
      },
    });

    return order;
  }

  // GET ORDER BY ID
  async getOrderById(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            phone: true,
            addressLine1: true,
            city: true,
          },
        },
        customer: {
          select: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        driver: {
          select: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
            vehicleType: true,
            vehicleNumber: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // GET RESTAURANT'S ORDERS
  async getRestaurantOrders(userId: string, status?: OrderStatus) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const where: any = { restaurantId: restaurant.id };
    if (status) {
      where.status = status;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        driver: {
          select: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { placedAt: 'desc' },
    });
  }

  // GET ACTIVE ORDERS (for live dashboard)
  async getActiveOrders(userId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return this.prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,
        status: {
          in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'],
        },
      },
      include: {
        customer: {
          select: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { placedAt: 'asc' },
    });
  }

  // ACCEPT ORDER (Restaurant)
  async acceptOrder(userId: string, orderId: string, dto: AcceptOrderDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.restaurantId !== restaurant.id) {
      throw new ForbiddenException('This order does not belong to your restaurant');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order cannot be accepted in current status');
    }

    // Calculate estimated delivery time
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(
      estimatedDeliveryTime.getMinutes() + dto.estimatedPrepTime + 20, // prep time + 20 min delivery
    );

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        estimatedPrepTime: dto.estimatedPrepTime,
        estimatedDeliveryTime,
      },
      include: {
        customer: {
          select: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // Create status history
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'ACCEPTED',
        changedBy: userId,
        notes: `Prep time: ${dto.estimatedPrepTime} minutes`,
      },
    });

    return updatedOrder;
  }

  // REJECT ORDER (Restaurant)
  async rejectOrder(userId: string, orderId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.restaurantId !== restaurant.id) {
      throw new ForbiddenException('This order does not belong to your restaurant');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Only pending orders can be rejected');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'REJECTED',
        cancelledAt: new Date(),
      },
    });

    // Create status history
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'REJECTED',
        changedBy: userId,
      },
    });

    return updatedOrder;
  }

  // MARK ORDER AS READY (Restaurant)
  async markOrderReady(userId: string, orderId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.restaurantId !== restaurant.id) {
      throw new ForbiddenException('This order does not belong to your restaurant');
    }

    if (order.status !== 'ACCEPTED' && order.status !== 'PREPARING') {
      throw new BadRequestException('Order must be accepted or preparing to mark as ready');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'READY',
        readyAt: new Date(),
      },
    });

    // Create status history
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'READY',
        changedBy: userId,
      },
    });

    // Create restaurant earning record
    const commission = order.subtotal * 0.20; // 20% commission
    await this.prisma.restaurantEarning.create({
      data: {
        restaurantId: restaurant.id,
        orderId: order.id,
        amount: order.subtotal,
        commission,
        netAmount: order.subtotal - commission,
      },
    });

    return updatedOrder;
  }

  // UPDATE ORDER STATUS (Generic)
  async updateOrderStatus(userId: string, orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
      },
    });

    // Create status history
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: dto.status,
        changedBy: userId,
        notes: dto.notes,
      },
    });

    return updatedOrder;
  }

  // GET ORDER HISTORY (with filters)
  async getOrderHistory(userId: string, page = 1, limit = 20) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          restaurantId: restaurant.id,
          status: {
            in: ['DELIVERED', 'CANCELLED', 'REJECTED'],
          },
        },
        include: {
          customer: {
            select: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { placedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({
        where: {
          restaurantId: restaurant.id,
          status: {
            in: ['DELIVERED', 'CANCELLED', 'REJECTED'],
          },
        },
      }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}