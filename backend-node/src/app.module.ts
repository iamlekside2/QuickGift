import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { HealthController } from './health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { ChatsModule } from './modules/chats/chats.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    CommonModule,
    // Feature modules (ported from FastAPI one by one):
    AuthModule,
    ProductsModule,
    ProvidersModule,
    OrdersModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    NotificationsModule,
    FeedbackModule,
    WalletModule,
    DisputesModule,
    ChatsModule,
    DeliveryModule,
    UploadModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
