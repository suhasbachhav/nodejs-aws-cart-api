import {
  Controller,
  Get,
  Delete,
  Put,
  Body,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Order, OrderService } from '../order';
import { AppRequest } from '../shared';
import { CartService } from './services';
import { CreateOrderDto, PutCartPayload } from 'src/order/type';
import { CartItem } from './entities/cart-item.entity';

const MOCK_USER_ID = 'e58852fc-a0cc-42f7-a251-b91b14d81369';
const MOCK_PRODUCT = {
  title: 'Mock Product Title',
  description: 'Mocked product as requirements do not specify product entity.',
  price: 1000,
};

@Controller('api/profile/cart')
export class CartController {
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
  ) {}

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Get()
  async findUserCart(): Promise<CartItem[]> {
    const cart = await this.cartService.findOrCreateByUserId(MOCK_USER_ID);

    return cart.items.map((item) => ({
      ...item,
      product: { ...MOCK_PRODUCT, id: item.productId },
    }));
  }

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Put()
  async updateUserCart(@Body() body: PutCartPayload): Promise<CartItem[]> {
    const cart = await this.cartService.updateByUserId(MOCK_USER_ID, body);
    return cart.items.map((item) => ({
      ...item,
      product: { ...MOCK_PRODUCT, id: item.productId },
    }));
  }

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearUserCart(): Promise<void> {
    await this.cartService.removeByUserId(MOCK_USER_ID);
  }

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Put('order')
  checkout(@Req() req: AppRequest, @Body() body: CreateOrderDto) {
    return body;
  }

  // @UseGuards(BasicAuthGuard)
  @Get('order')
  getOrder(): Order[] {
    return this.orderService.getAll();
  }
}
