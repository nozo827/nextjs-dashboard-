const { sql } = require('@vercel/postgres');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function cleanDatabase() {
  try {
    console.log('🧹 古いテーブルを削除中...\n');

    // 古いテーブルを削除
    const oldTables = ['invoices', 'customers', 'revenue', 'users'];

    for (const table of oldTables) {
      try {
        await sql.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
        console.log(`  ✅ ${table} を削除しました`);
      } catch (error) {
        console.log(`  ⚠️  ${table} の削除をスキップしました`);
      }
    }

    console.log('\n✅ データベースのクリーンアップが完了しました！');
    process.exit(0);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

cleanDatabase();
