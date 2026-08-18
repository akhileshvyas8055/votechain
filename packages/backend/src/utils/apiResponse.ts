import { ApiResponse, ApiErrorResponse, PaginatedResponse } from '../types';

export function success<T>(data: T, message = 'Success', meta?: any): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    ...(meta && { meta }),
  };
}

export function error(message: string, code = 'INTERNAL_ERROR', details?: any): ApiErrorResponse {
  return {
    success: false,
    message,
    code,
    ...(details && { details }),
  };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}
