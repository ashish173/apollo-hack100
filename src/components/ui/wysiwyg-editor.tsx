'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import { LoadingSpinner } from './loading-spinner';
import { ClientOnly } from './client-only';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(
  () => import('react-quill'),
  {
    ssr: false,
    loading: () => <div className="h-48 w-full flex items-center justify-center"><LoadingSpinner /></div>
  }
);

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    ['link'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link'
];

export function WysiwygEditor({ value, onChange, placeholder }: WysiwygEditorProps) {
  return (
    <ClientOnly>
        <div className="bg-white">
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                style={{ height: '200px', marginBottom: '40px' }}
            />
        </div>
    </ClientOnly>
  );
}
