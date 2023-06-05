import {
  BadRequestException,
  MiddlewareConsumer,
  Module,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection, getConnection } from 'typeorm';

import { Tenant } from './tenant.entity';

export const TENANT_CONNECTION = 'TENANT_CONNECTION';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  providers: [
    {
      provide: TENANT_CONNECTION,
      inject: [REQUEST, Connection],
      scope: Scope.REQUEST,
      useFactory: async (request, connection) => {
        const tenant: Tenant = await connection
          .getRepository(Tenant)
          .findOne({ where: { host: request.body.host } });
        return getConnection(tenant.name);
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
        const { host } = req.body;
        const tenant: Tenant = await this.connection
          .getRepository(Tenant)
          .findOne({ where: { host } });
        if (!tenant) {
          throw new BadRequestException(
            'Database Connection Error',
            'There is an Error with the Database!',
          );
        }
        const postData = {
          name: tenant.name,
        };

        await fetch('http://localhost:5000/connect-database', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        return res.status(200).json({
          sucess: true,
          message: 'Database Connection Success',
        });
      })
      .forRoutes('*');
  }
}
