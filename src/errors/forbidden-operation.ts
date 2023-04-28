import { ApplicationError } from '@/protocols';

export function forbiddenOperationError(): ApplicationError {
  return {
    name: 'ForbiddenOperationError',
    message: 'forbidden operation',
  };
}
