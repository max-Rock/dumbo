import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure properly in production
  },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('OrdersGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Join restaurant room
  @SubscribeMessage('join-restaurant')
  handleJoinRestaurant(client: Socket, restaurantId: string) {
    client.join(`restaurant-${restaurantId}`);
    this.logger.log(`Client ${client.id} joined restaurant-${restaurantId}`);
  }

  // Join customer room
  @SubscribeMessage('join-customer')
  handleJoinCustomer(client: Socket, customerId: string) {
    client.join(`customer-${customerId}`);
    this.logger.log(`Client ${client.id} joined customer-${customerId}`);
  }

  // Emit new order to restaurant
  notifyNewOrder(restaurantId: string, order: any) {
    this.server.to(`restaurant-${restaurantId}`).emit('order:new', order);
  }

  // Emit order status update to customer
  notifyOrderUpdate(customerId: string, order: any) {
    this.server.to(`customer-${customerId}`).emit('order:update', order);
  }

  // Emit order accepted to customer
  notifyOrderAccepted(customerId: string, order: any) {
    this.server.to(`customer-${customerId}`).emit('order:accepted', order);
  }

  // Emit order ready to driver
  notifyOrderReady(driverId: string, order: any) {
    this.server.to(`driver-${driverId}`).emit('order:ready', order);
  }
}