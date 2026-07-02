import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// ISR/revalidate は未使用（全ページ force-dynamic）のため、
// キャッシュのカスタマイズは行わずデフォルト設定のみ使用する。
export default defineCloudflareConfig();
