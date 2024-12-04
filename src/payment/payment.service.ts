import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  async createPayment(): Promise<any> {
    const accessKey = 'F8BBA842ECF85';
    const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    const partnerCode = 'MOMO';
    const redirectUrl = 'http://localhost:3000/singers/createSinger';
    //link api moi
    const ipnUrl =
      'https://39b0-2401-d800-9340-1ba6-a0ab-2266-4844-1fba.ngrok-free.app/api/v1/payment/ipn';
    const requestType = 'payWithMethod';
    const amount = '289000';
    const orderInfo = 'Nâng cấp tài khoản';
    const orderId = `${partnerCode}${Date.now()}`;
    const requestId = orderId;
    const extraData = '';
    const autoCapture = true;
    const lang = 'vi';
    const orderGroupId = '';

    // Generate the raw signature
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    // Request body
    const requestBody = {
      partnerCode: partnerCode,
      partnerName: 'Test',
      storeId: 'MomoTestStore',
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      lang: lang,
      requestType: requestType,
      autoCapture: autoCapture,
      extraData: extraData,
      orderGroupId: orderGroupId,
      signature: signature,
    };

    // Axios POST request
    try {
      const response = await axios.post(
        'https://test-payment.momo.vn/v2/gateway/api/create',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.response?.data || error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
