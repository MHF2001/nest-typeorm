import {
  BadRequestException,
  MiddlewareConsumer,
  Module,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection, createConnection, getConnection } from 'typeorm';

// import { Tenant } from './tenant.entity';
import { Book } from '../books/book.entity';

export const TENANT_CONNECTION = 'TENANT_CONNECTION';

@Module({
  imports: [TypeOrmModule.forFeature()],
  providers: [
    {
      provide: TENANT_CONNECTION,
      inject: [REQUEST, Connection],
      scope: Scope.REQUEST,
      useFactory: async request => {
        const { name } = request.body;

        const connection = getConnection(name);
        if (connection) {
          return connection;
        } else {
          throw new BadRequestException(
            'Database Connection Error',
            'There is a Error with the Database!',
          );
        }
      },
    },
  ],
  exports: [TENANT_CONNECTION],
})
export class TenantModule {
  constructor(private readonly connection: Connection) {}

  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(async (req, res, next) => {
        const { name } = req.body;
        const createdConnection: Connection = await createConnection({
          name: name,
          type: 'mysql',
          host: '127.0.0.1',
          port: 3306,
          username: 'root',
          password: '0000',
          database: name,
          synchronize: true,
        });

        if (createdConnection) {
          // next();
          // return createdConnection.isConnected;
          console.log('====================================');
          console.log(createdConnection.isConnected);
          console.log('====================================');
        } else {
          throw new BadRequestException(
            'Database Connection Error',
            'There is a Error with the Database!',
          );
        }
      })
      .forRoutes('*');
  }
}
