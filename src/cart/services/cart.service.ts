import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PutCartPayload } from 'src/order/type';
import { Cart, CartStatus } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
  ) {}

  async findByUserId(userId: string): Promise<Cart | null> {
    return this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
      order: {
        items: {
          created_at: 'DESC',
        },
      },
    });
  }

  async createByUserId(userId: string): Promise<Cart> {
    const cart = this.cartRepository.create({
      userId,
      status: CartStatus.OPEN,
      items: [],
    });

    return this.cartRepository.save(cart);
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const userCart = await this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, payload: PutCartPayload): Promise<Cart> {
    const userCart = await this.findOrCreateByUserId(userId);

    // Find existing cart item with the same product
    const existingCartItem = userCart.items.find(
      (item) => item.productId === payload.product.id,
    );

    if (existingCartItem) {
      if (payload.count === 0) {
        // Remove the item
        await this.cartItemRepository.remove(existingCartItem);
        userCart.items = userCart.items.filter(
          (item) => item.id !== existingCartItem.id,
        );
      } else {
        // Update the count
        existingCartItem.count = payload.count;
        await this.cartItemRepository.save(existingCartItem);
      }
    } else if (payload.count > 0) {
      // Add new item
      const newCartItem = this.cartItemRepository.create({
        cartId: userCart.id,
        productId: payload.product.id,
        count: payload.count,
        cart: userCart,
      });

      const savedCartItem = await this.cartItemRepository.save(newCartItem);
      userCart.items.push(savedCartItem);
    }

    return userCart;
  }

  async removeByUserId(userId: string): Promise<void> {
    const userCart = await this.findByUserId(userId);

    if (userCart) {
      // Remove all cart items first (should cascade automatically, but being explicit)
      await this.cartItemRepository.remove(userCart.items);
      // Remove the cart
      await this.cartRepository.remove(userCart);
    }
  }
}
