const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function applySchema() {
  try {
    console.log('📦 データベーススキーマを適用中...');

    // スキーマファイルを読み込む
    const schemaPath = path.join(__dirname, '..', 'app', 'lib', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // SQLを実行
    await sql.query(schema);

    console.log('✅ スキーマの適用が完了しました！');

    // テーブルの確認
    const result = await sql.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📋 作成されたテーブル:');
    result.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

applySchema();
