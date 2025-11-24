'use client';

import { useState, useRef } from 'react';
import { PhotoIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface MediaUploaderProps {
  onInsert: (url: string, type: string) => void;
}

export default function MediaUploader({ onInsert }: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<
    Array<{ url: string; type: string; filename: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[MediaUploader] File select triggered');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('[MediaUploader] No file selected');
      return;
    }

    console.log('[MediaUploader] File selected:', file.name, file.size, file.type);
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('[MediaUploader] Uploading file:', file.name, file.size, 'bytes');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('[MediaUploader] Response status:', response.status);

      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[MediaUploader] Failed to parse error response:', parseError);
          throw new Error(`アップロードに失敗しました (${response.status} ${response.statusText})`);
        }
        console.error('[MediaUploader] Upload failed:', response.status, data);
        throw new Error(data.error || data.details || `アップロードに失敗しました (${response.status})`);
      }

      const data = await response.json();

      // アップロード成功
      setUploadedMedia([
        ...uploadedMedia,
        {
          url: data.url,
          type: data.type,
          filename: data.filename,
        },
      ]);
    } catch (err) {
      console.error('[MediaUploader] Upload error:', err);
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
      // ファイル選択をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInsertClick = (url: string, type: string) => {
    onInsert(url, type);
  };

  const handleRemove = (index: number) => {
    setUploadedMedia(uploadedMedia.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          画像・動画のアップロード
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          画像: JPG, PNG, GIF, WebP（最大10MB）/ 動画: MP4, WebM, OGG（最大50MB）
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => {
            console.log('[MediaUploader] Button clicked, opening file picker');
            fileInputRef.current?.click();
          }}
          disabled={isUploading}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>アップロード中...</>
          ) : (
            <>
              <PhotoIcon className="h-5 w-5" />
              ファイルを選択
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {uploadedMedia.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            アップロード済み
          </h4>
          <div className="space-y-2">
            {uploadedMedia.map((media, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {media.type.startsWith('image/') ? (
                    <PhotoIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <VideoCameraIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-600 truncate">
                    {media.filename}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    type="button"
                    onClick={() => handleInsertClick(media.url, media.type)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                  >
                    挿入
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-md bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-800">
              💡 「挿入」ボタンをクリックすると、本文のカーソル位置にメディアのマークダウンが挿入されます。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
