const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

async function addAdmin() {
  try {
    console.log('管理者ユーザーを追加しています...');

    const email = 'nozo_melody_2005@yahoo.co.jp';
    const name = '佐藤希美';
    const password = 'nozonozo';

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // 既存のユーザーを確認
    const existingUser = await sql`
      SELECT id, role FROM users WHERE email = ${email}
    `;

    if (existingUser.rows.length > 0) {
      // 既存ユーザーを管理者に更新
      await sql`
        UPDATE users
        SET name = ${name},
            password = ${hashedPassword},
            role = 'admin'
        WHERE email = ${email}
      `;
      console.log(`✓ 既存ユーザー「${name}」を管理者に更新しました`);
    } else {
      // 新規管理者を作成
      await sql`
        INSERT INTO users (name, email, password, role, created_at)
        VALUES (${name}, ${email}, ${hashedPassword}, 'admin', NOW())
      `;
      console.log(`✓ 新規管理者「${name}」を作成しました`);
    }

    // 全ての既存ユーザーを一般ユーザーに変更（この管理者以外）
    const result = await sql`
      UPDATE users
      SET role = 'user'
      WHERE email != ${email} AND role != 'user'
    `;

    if (result.rowCount > 0) {
      console.log(`✓ ${result.rowCount}人のユーザーを一般ユーザーに変更しました`);
    }

    console.log('\n管理者情報:');
    console.log(`メールアドレス: ${email}`);
    console.log(`名前: ${name}`);
    console.log(`役割: admin`);
    console.log('\n✓ 管理者の設定が完了しました！');

  } catch (error) {
    console.error('エラーが発生しました:', error);
    throw error;
  }
}

addAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
