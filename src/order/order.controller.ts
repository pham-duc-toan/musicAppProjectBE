// src/order/order.controller.ts

import { Controller, Post, Body, Param, Patch, Get } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from './order.schema';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // // API tạo đơn hàng
  // @Post('create')
  // async createOrder(@Body('orderId') orderId: string): Promise<Order> {
  //   return this.orderService.createOrder(orderId);
  // }

  // @Patch(':orderId/status')
  // async updateStatus(
  //   @Param('orderId') orderId: string,
  //   @Body('status') status: string,
  // ): Promise<Order> {
  //   if (status !== 'done') {
  //     throw new Error('Status can only be updated to "done"');
  //   }

  //   return this.orderService.updateStatus(orderId, status);
  // }

  // API lấy tất cả đơn hàng trong một tháng cụ thể (dựa vào createdAt)
  @Get('month/:year/:month')
  async getOrdersByMonth(
    @Param('year') year: number,
    @Param('month') month: number,
  ): Promise<Order[]> {
    return this.orderService.getOrdersByMonth(year, month);
  }

  // API lấy thông tin đơn hàng theo orderId
  @Get(':orderId')
  async getOrderById(@Param('orderId') orderId: string): Promise<Order> {
    return this.orderService.getOrderById(orderId);
  }
}
