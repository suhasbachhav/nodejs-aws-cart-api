import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

import { AppController } from './app.controller';

import { CartModule } from './cart/cart.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secretArn = configService.get<string>('DB_SECRET_ARN');
        const dbUser = configService.get<string>('DB_USER');
        const dbPassword = configService.get<string>('DB_PASSWORD');
        let dbCredentials = { username: dbUser, password: dbPassword };

        if (secretArn) {
          const secretsClient = new SecretsManagerClient({
            region: process.env.AWS_REGION,
          });

          const command = new GetSecretValueCommand({
            SecretId: secretArn,
          });

          const response = await secretsClient.send(command);
          if (response.SecretString) {
            dbCredentials = JSON.parse(response.SecretString);
          }
        }

        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: parseInt(configService.get('DB_PORT'), 10),
          username: dbCredentials.username,
          password: dbCredentials.password,
          database: configService.get('DB_NAME'),
          autoLoadEntities: true,
          synchronize: true,
          ssl: {
            rejectUnauthorized: false,
          },
          namingStrategy: new SnakeNamingStrategy(),
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    CartModule,
    OrderModule,
    ConfigModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
