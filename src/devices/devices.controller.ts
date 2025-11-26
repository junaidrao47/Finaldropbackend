import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RegisterDeviceDto } from './dto/device.dto';

@Controller('devices')
@UseGuards(AuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  async listDevices(@CurrentUser() user: any) {
    return this.devicesService.findAllByUser(user.id);
  }

  @Post('register')
  async registerDevice(
    @CurrentUser() user: any,
    @Body() body: RegisterDeviceDto,
    @Req() req: any,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection?.remoteAddress;
    
    return this.devicesService.registerDevice(
      user.id,
      body.deviceFingerprint,
      body.deviceName,
      userAgent,
      ipAddress,
    );
  }

  @Delete(':id')
  async revokeDevice(@CurrentUser() user: any, @Param('id') deviceId: string) {
    await this.devicesService.revokeDevice(user.id, parseInt(deviceId, 10));
    return { success: true, message: 'Device revoked' };
  }

  @Delete()
  async revokeAllDevices(@CurrentUser() user: any) {
    const count = await this.devicesService.revokeAllDevices(user.id);
    return { success: true, message: `Revoked ${count} devices` };
  }
}
