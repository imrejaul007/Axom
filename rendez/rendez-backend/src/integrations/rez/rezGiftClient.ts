import { rezClient as client } from './rezClient';
import { AppError } from '../../middleware/errorHandler';
import { log } from '../../config/telemetry';

export interface GiftCatalogItem {
  id: string;
  name: string;
  description: string;
  amount_paise: number;
  merchant_name: string;
  merchant_logo_url: string;
  category: string;
  validity_days: number;
  tier: 'signal' | 'coffee' | 'treat' | 'experience' | 'exclusive';
  city: string;
}

export interface IssueVoucherResult {
  voucher_id: string;
  qr_code_url: string;
  expires_at: string;
}

export async function getCatalog(city?: string): Promise<GiftCatalogItem[]> {
  try {
    const { data } = await client.get('/gifts/catalog', { params: { city } });
    return data;
  } catch (err) {
    log.error({ err, city }, '[RezGift] getCatalog failed');
    throw err instanceof AppError ? err : new AppError(502, 'Gift catalog unavailable');
  }
}

export async function issueVoucher(params: {
  catalog_item_id: string;
  sender_rez_id: string;
  receiver_rez_id: string;
  hold_id: string;
  idempotency_key: string;
}): Promise<IssueVoucherResult> {
  try {
    const { data } = await client.post('/gifts/issue', params);
    return data;
  } catch (err) {
    log.error({ err, params }, '[RezGift] issueVoucher failed');
    throw err instanceof AppError ? err : new AppError(502, 'Voucher issue failed');
  }
}

export async function activateVoucher(voucherId: string): Promise<void> {
  try {
    await client.post(`/gifts/activate/${voucherId}`);
  } catch (err) {
    log.error({ err, voucherId }, '[RezGift] activateVoucher failed');
    throw err instanceof AppError ? err : new AppError(502, 'Voucher activation failed');
  }
}

export async function cancelVoucher(voucherId: string, reason: string): Promise<void> {
  try {
    await client.post(`/gifts/cancel/${voucherId}`, { reason });
  } catch (err) {
    log.error({ err, voucherId }, '[RezGift] cancelVoucher failed');
    throw err instanceof AppError ? err : new AppError(502, 'Voucher cancellation failed');
  }
}

export async function getVoucher(voucherId: string): Promise<{ qr_code_url: string; status: string; merchant_name: string; valid_until: string }> {
  try {
    const { data } = await client.get(`/gifts/voucher/${voucherId}`);
    return data;
  } catch (err) {
    log.error({ err, voucherId }, '[RezGift] getVoucher failed');
    throw err instanceof AppError ? err : new AppError(502, 'Voucher lookup failed');
  }
}
