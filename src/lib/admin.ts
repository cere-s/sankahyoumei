/** 管理者（任意の画像を削除できる）の Supabase Auth ユーザーID 一覧 */
function adminIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return adminIds().includes(userId);
}
