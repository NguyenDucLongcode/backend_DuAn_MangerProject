import { Request, Response, NextFunction } from 'express';
import { Histogram } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Thời gian xử lý HTTP request',
  labelNames: ['method', 'route', 'status_code'],
});

export function prometheusMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    end({
      method: req.method,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      route: req.route?.path || req.path,
      status_code: res.statusCode,
    });
  });
  next();
}
