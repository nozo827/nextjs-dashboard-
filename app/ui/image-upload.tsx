'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageUploadProps {
  onImageSelect: (imageUrl: string) => void;
  currentImage?: string | null;
  label?: string;
}

export default function ImageUpload({
  onImageSelect,
  currentImage,
  label = 'アイキャッチ画像'
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }

    // 画像ファイルかチェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    setUploading(true);

    try {
      // プレビュー表示用
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // サーバーにアップロード
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[ImageUpload] Upload failed:', response.status, errorData);
        throw new Error(errorData.error || errorData.details || `アップロードに失敗しました (${response.status})`);
      }

      const data = await response.json();
      console.log('Upload success:', data);
      onImageSelect(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      alert(`画像のアップロードに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onImageSelect('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {preview ? (
        <div className="relative w-full h-64 rounded-lg border-2 border-gray-300 overflow-hidden">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="w-full">
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <PhotoIcon className="w-12 h-12 text-gray-400 mb-3" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">クリックして画像を選択</span>
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF (最大5MB)</p>
            </div>
            <input
              id="image-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {uploading && (
        <div className="text-sm text-gray-500">アップロード中...</div>
      )}
    </div>
  );
}
