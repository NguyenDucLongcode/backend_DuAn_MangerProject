import { Injectable } from '@nestjs/common';
import { Counter } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly loginCounter = new Counter({
    name: 'user_login_total',
    help: 'Tổng số lần đăng nhập thành công',
    labelNames: ['device_id'],
  });

  incLogin(deviceId: string) {
    this.loginCounter.labels(deviceId).inc();
  }
}
