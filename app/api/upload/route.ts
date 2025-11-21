import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

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

    // アップロードディレクトリのパス（画像と動画で分ける）
    const subDir = file.type.startsWith('video/') ? 'videos' : 'images';
    const uploadDir = join(process.cwd(), 'public', 'uploads', subDir);

    // ディレクトリが存在しない場合は作成
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // ファイルを保存
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // 公開URL
    const url = `/uploads/${subDir}/${filename}`;

    return NextResponse.json({
      url,
      type: file.type,
      size: file.size,
      filename,
    }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'アップロードに失敗しました' },
      { status: 500 }
    );
  }
}
