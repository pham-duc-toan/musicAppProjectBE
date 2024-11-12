import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleSchema } from './roles.schema';
import { PermissionsModule } from 'src/permissions/permissions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Role', schema: RoleSchema }]),
    PermissionsModule,
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
