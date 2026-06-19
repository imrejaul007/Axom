/**
 * Shared REZ partner API axios client.
 * Normalises all REZ API errors so partner internals are never leaked to end users.
 */
import axios, { AxiosError } from 'axios';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';

export const rezClient = axios.create({
  baseURL: env.REZ.API_URL,
  headers: { 'x-partner-key': env.REZ.API_KEY },
  timeout: 10000,
});

rezClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const status = err.response?.status;
    const rezMessage = (err.response?.data as { message?: string })?.message;

    // Map REZ status codes to Rendez-appropriate codes
    if (status === 402 || status === 422) {
      // Insufficient balance or validation error — surface to user safely
      throw new AppError(status, rezMessage || 'REZ wallet operation failed');
    }
    if (status && status >= 400 && status < 500) {
      throw new AppError(400, rezMessage || 'Invalid request to payment partner');
    }
    // 5xx or network errors — don't expose REZ internals
    throw new AppError(502, 'Payment partner temporarily unavailable — please try again');
  },
);
