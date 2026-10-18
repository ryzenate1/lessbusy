import { type ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import { type Response } from 'express';
import { ZodError } from 'zod';

@Catch(ZodError)
export class BusinessInputFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    host.switchToHttp().getResponse<Response>().status(400).json({ message: 'Please check the submitted values', fields: exception.issues.map(({ path, message }) => ({ path: path.join('.'), message })) });
  }
}
