import { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function RichTextEditor({ 
  value = '', 
  onChange, 
  placeholder = 'Enter rich text content...', 
  className = '',
  disabled = false 
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);
  const [editorValue, setEditorValue] = useState(value);

  // Custom toolbar configuration with text alignment and image support
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'align': [] }], // Text alignment options
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'color', 'background',
    'align'
  ];

  // Custom image handler for drag and drop support
  function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            quill.insertEmbed(range?.index || 0, 'image', imageUrl);
          }
        };
        reader.readAsDataURL(file);
      }
    };
  }

  const handleChange = (content: string) => {
    setEditorValue(content);
    onChange?.(content);
  };

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  // Enhanced styles for better drag and drop experience
  const editorStyle = {
    minHeight: '200px',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-editor .ql-editor {
            min-height: 150px;
            font-size: 14px;
            line-height: 1.5;
          }
          
          .rich-text-editor .ql-toolbar {
            border-top: 1px solid #d1d5db;
            border-left: 1px solid #d1d5db;
            border-right: 1px solid #d1d5db;
            border-bottom: none;
            border-radius: 0.375rem 0.375rem 0 0;
          }
          
          .rich-text-editor .ql-container {
            border-bottom: 1px solid #d1d5db;
            border-left: 1px solid #d1d5db;
            border-right: 1px solid #d1d5db;
            border-top: none;
            border-radius: 0 0 0.375rem 0.375rem;
          }
          
          .rich-text-editor .ql-editor.ql-blank::before {
            color: #9ca3af;
            font-style: normal;
          }
          
          .rich-text-editor .ql-editor:hover {
            border-color: #6366f1;
          }
          
          .rich-text-editor .ql-editor img {
            max-width: 100%;
            height: auto;
            border-radius: 0.25rem;
            margin: 0.5rem 0;
          }
          
          .rich-text-editor .ql-align-center {
            text-align: center;
          }
          
          .rich-text-editor .ql-align-right {
            text-align: right;
          }
          
          .rich-text-editor .ql-align-justify {
            text-align: justify;
          }
        `
      }} />
      
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={editorValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        style={editorStyle}
      />
    </div>
  );
}