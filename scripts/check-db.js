const { sql } = require('@vercel/postgres');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function checkDatabase() {
  try {
    console.log('🔍 データベースの状態を確認中...\n');

    // テーブル一覧を取得
    const tables = await sql.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📋 既存のテーブル:');
    if (tables.rows.length === 0) {
      console.log('  (テーブルなし)');
    } else {
      tables.rows.forEach((row) => {
        console.log(`  - ${row.table_name}`);
      });
    }

    console.log('\n✅ 確認完了');
    process.exit(0);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

checkDatabase();
