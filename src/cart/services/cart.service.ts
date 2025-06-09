import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PutCartPayload } from 'src/order/type';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from '../entities/cart-item.entity';
import { Repository } from 'typeorm';
import { Cart, CartStatus } from '../entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartsRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemsRepository: Repository<CartItem>,
  ) {}

  async findByUserId(userId: string): Promise<Cart> {
    return await this.cartsRepository.findOne({
      where: { user_id: userId },
      relations: ['items'],
    });
  }

  async createByUserId(user_id: string): Promise<Cart> {
    const createdCart = this.cartsRepository.create({
      id: randomUUID(),
      user_id,
      status: CartStatus.OPEN,
      items: [],
    });

    return await this.cartsRepository.save(createdCart);
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const userCart = await this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return await this.createByUserId(userId);
  }

  async updateByUserId(userId: string, payload: PutCartPayload): Promise<Cart> {
    const userCart = await this.findOrCreateByUserId(userId);

    const index = (userCart.items || []).findIndex(
      (cartItem) => cartItem.product_id === payload.product.id,
    );

    if (index === -1) {
      const newCartItem = this.cartItemsRepository.create({
        product_id: payload.product.id,
        count: payload.count,
        cart: userCart,
      });
      await this.cartItemsRepository.save(newCartItem);
    } else if (payload.count === 0) {
      await this.cartItemsRepository.delete({
        product_id: payload.product.id,
      });
    } else {
      await this.cartItemsRepository.update(
        { product_id: payload.product.id },
        { count: payload.count },
      );
    }

    return userCart;
  }

  removeByUserId(userId): void {
    this.cartsRepository.delete({ user_id: userId });
  }
}
