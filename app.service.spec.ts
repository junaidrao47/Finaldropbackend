import { AppService } from './src/app.service';

describe('AppService', () => {
  it('should be defined', () => {
    const service = new AppService();
    expect(service).toBeDefined();
    expect(service.getHello()).toBe('Hello World!');
  });
});