'use client';

import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlContentProps {
  html: string;
  className?: string;
}

export function SafeHtmlContent({ html, className = '' }: SafeHtmlContentProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState('');

  useEffect(() => {
    // クライアントサイドでのみDOMPurifyを実行
    if (typeof window !== 'undefined') {
      const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'strong', 'em', 'u', 'strike',
          'a', 'img', 'ul', 'ol', 'li',
          'pre', 'code', 'blockquote',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'div', 'span'
        ],
        ALLOWED_ATTR: [
          'href', 'src', 'alt', 'title', 'class',
          'target', 'rel', 'width', 'height'
        ],
        ALLOW_DATA_ATTR: false,
        ADD_ATTR: ['target'], // リンクのtarget属性を許可
      });
      setSanitizedHtml(clean);
    }
  }, [html]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
