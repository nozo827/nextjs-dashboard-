import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { auth } from '@/auth';

// APIルートのボディサイズ制限を設定（50MB）
export const runtime = 'nodejs';
export const maxDuration = 30; // 最大30秒

// 本番環境（Vercel）かどうかを判定
const isProduction = process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview';

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload] Starting upload process...');

    // 認証チェック
    const session = await auth();
    console.log('[Upload] Session check:', session ? 'authenticated' : 'not authenticated');

    if (!session?.user) {
      console.log('[Upload] Authentication failed');
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    console.log('[Upload] File received:', file ? `${file.name} (${file.size} bytes, ${file.type})` : 'no file');

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 400 }
      );
    }

    // ファイルサイズチェック（動画は50MB、画像は10MB）
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `ファイルサイズが大きすぎます（画像: 最大10MB、動画: 最大50MB）` },
        { status: 400 }
      );
    }

    // 許可するファイルタイプ
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/ogg',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '許可されていないファイル形式です（画像: JPG, PNG, GIF, WebP / 動画: MP4, WebM, OGG）' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ファイル名を生成（タイムスタンプ + ランダム文字列）
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);

    // 拡張子を安全に取得（パストラバーサル対策）
    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 拡張子の検証
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg'];
    if (!extension || !allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: '許可されていないファイル拡張子です' },
        { status: 400 }
      );
    }

    const filename = `${timestamp}-${randomString}.${extension}`;
    let url: string;

    // 本番環境（Vercel）の場合はVercel Blob Storageを使用
    if (isProduction) {
      console.log('[Upload] Using Vercel Blob Storage (production)');

      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('[Upload] BLOB_READ_WRITE_TOKEN is not set');
        return NextResponse.json(
          { error: 'ストレージの設定が完了していません。管理者に連絡してください。' },
          { status: 500 }
        );
      }

      // Vercel Blob Storageにアップロード
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: file.type,
      });

      url = blob.url;
      console.log('[Upload] Upload successful to Vercel Blob:', url);
    } else {
      // ローカル環境の場合はファイルシステムに保存
      console.log('[Upload] Using local filesystem (development)');

      const subDir = file.type.startsWith('video/') ? 'videos' : 'images';
      const uploadDir = join(process.cwd(), 'public', 'uploads', subDir);

      // ディレクトリが存在しない場合は作成
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      // ファイルを保存
      const filepath = join(uploadDir, filename);
      console.log('[Upload] Saving file to:', filepath);
      await writeFile(filepath, buffer);

      // 公開URL
      url = `/uploads/${subDir}/${filename}`;
      console.log('[Upload] Upload successful to local filesystem:', url);
    }

    return NextResponse.json({
      url,
      type: file.type,
      size: file.size,
      filename,
    }, { status: 200 });
  } catch (error) {
    console.error('[Upload] Upload error:', error);
    return NextResponse.json(
      { error: 'アップロードに失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
