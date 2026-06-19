import { rezClient as client } from './rezClient';


export interface RezVerifyResult {
  valid: boolean;
  rez_user_id: string;
  phone: string;
  verified_status: 'verified' | 'unverified' | 'pending';
}

export async function verifyRezToken(token: string): Promise<RezVerifyResult> {
  const { data } = await client.get('/auth/verify-token', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function linkAccount(rezUserId: string, rendezUserId: string): Promise<void> {
  await client.post('/auth/link', { rez_user_id: rezUserId, rendez_user_id: rendezUserId });
}
