// src/order/order.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from './order.schema';

@Injectable()
export class OrderService {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

  // Tạo đơn hàng mới
  async createOrder(orderId: string): Promise<Order> {
    const order = new this.orderModel({ orderId, status: 'init' });
    return order.save();
  }

  // Cập nhật trạng thái đơn hàng
  async updateStatus(orderId: string, status: string): Promise<Order> {
    const updatedOrder = await this.orderModel.findOneAndUpdate(
      { orderId, status: 'init' }, // Chỉ cập nhật nếu trạng thái là 'init'
      { status },
      { new: true }, // Trả về đối tượng đã được cập nhật
    );
    return updatedOrder;
  }

  // Lấy đơn hàng theo tháng (dựa vào createdAt)
  async getOrdersByMonth(year: number, month: number): Promise<Order[]> {
    const startDate = new Date(year, month - 1, 1); // Bắt đầu từ ngày 1 của tháng
    const endDate = new Date(year, month, 0); // Kết thúc vào cuối tháng

    return this.orderModel.find({
      createdAt: { $gte: startDate, $lt: endDate },
    });
  }

  // Lấy thông tin đơn hàng theo orderId
  async getOrderById(orderId: string): Promise<Order> {
    return this.orderModel.findOne({ orderId });
  }
}
