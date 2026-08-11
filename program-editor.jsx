import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';

// Colour palette shared with VivoRich
const PALETTE = [
  { label: "Cream",       hex: "#FFFBEB" },
  { label: "Plum",        hex: "#BD2691" },
  { label: "Tangerine",   hex: "#EF4C26" },
  { label: "Orange",      hex: "#FF9E1D" },
  { label: "Blue",        hex: "#007ACC" },
  { label: "Sky",         hex: "#39BDFF" },
  { label: "Green",       hex: "#1BC469" },
  { label: "Light green", hex: "#CFFFA2" },
  { label: "Lavender",    hex: "#C4B1C9" },
  { label: "Black",       hex: "#0A0A0B" },
];

// ---- tiny SVG helpers ----
const Svg = ({ children, ...p }) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);
const IcoUndo = () => <Svg><path d="M3 7v6h6"/><path d="M3 13A9 9 0 1 0 5.7 5.7L3 7"/></Svg>;
const IcoRedo = () => <Svg><path d="M21 7v6h-6"/><path d="M21 13A9 9 0 1 1 18.3 5.7L21 7"/></Svg>;
const IcoAlignL = () => <Svg stroke="currentColor"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></Svg>;
const IcoAlignC = () => <Svg><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></Svg>;
const IcoAlignR = () => <Svg><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></Svg>;
const IcoAlignJ = () => <Svg><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></Svg>;
const IcoListBullet = () => <Svg><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></Svg>;
const IcoListNum = () => <Svg><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4" strokeWidth="1.5"/><path d="M3.5 14h2M3.5 18h2M5.5 14v1.5a1 1 0 0 1-2 1V18" strokeWidth="1.5"/></Svg>;
const IcoIndent = () => <Svg><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/><polyline points="9,9 12,12 9,15"/><line x1="12" y1="12" x2="7" y2="12"/></Svg>;
const IcoOutdent = () => <Svg><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/><polyline points="15,9 12,12 15,15"/><line x1="12" y1="12" x2="17" y2="12"/></Svg>;
const IcoClear = () => <Svg><path d="M4 7l3-3 9 9-3 3z"/><path d="M14 4l3 3"/><line x1="5" y1="20" x2="20" y2="20"/><line x1="17" y1="17" x2="20" y2="20"/></Svg>;
const IcoLink = () => <Svg><path d="M9 15 15 9"/><path d="M11 6.5 13 4.5a3.5 3.5 0 0 1 5 5l-2 2"/><path d="M13 17.5 11 19.5a3.5 3.5 0 0 1-5-5l2-2"/></Svg>;
const IcoHr = () => <Svg><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2.5"/><path d="M3 6 l2 6 -2 6" strokeWidth="1.5"/><path d="M21 6 l-2 6 2 6" strokeWidth="1.5"/></Svg>;

// ---- Colour fly-out ----
const ColorFlyout = ({ onSelect, onClear, label, clearLabel }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <span ref={ref} className="pe-color-wrap">
      <button className="pe-btn" title={label} onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13 }}>A</span>
        <span className="pe-color-stripe" style={{ background: 'currentColor', opacity: 0.5 }} />
      </button>
      {open && (
        <div className="pe-flyout" onMouseDown={e => e.preventDefault()}>
          <div className="pe-flyout-label">{label}</div>
          <div className="pe-swatches">
            {clearLabel && (
              <button className="pe-swatch pe-swatch-clear" title="Default" onClick={() => { onClear(); setOpen(false); }}>✕</button>
            )}
            {PALETTE.map(c => (
              <button key={c.hex} className="pe-swatch" title={c.label} style={{ background: c.hex }}
                onClick={() => { onSelect(c.hex); setOpen(false); }} />
            ))}
          </div>
        </div>
      )}
    </span>
  );
};

// ---- Link popover ----
const LinkPopover = ({ editor }) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const apply = () => {
    if (!url.trim()) { editor.chain().focus().extendMarkToNextWord().unsetLink().run(); }
    else { editor.chain().focus().setLink({ href: url.trim(), target: '_blank', rel: 'noopener noreferrer' }).run(); }
    setOpen(false);
  };
  return (
    <span ref={ref} className="pe-color-wrap">
      <button className="pe-btn" title="Link" onMouseDown={e => {
        e.preventDefault();
        const existing = editor.getAttributes('link').href || '';
        setUrl(existing);
        setOpen(v => !v);
      }}><IcoLink /></button>
      {open && (
        <div className="pe-flyout pe-link-flyout" onMouseDown={e => e.preventDefault()}>
          <div className="pe-flyout-label">Link URL</div>
          <input className="pe-link-input" type="url" value={url} placeholder="https://vivoperformingarts.org"
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } if (e.key === 'Escape') setOpen(false); }}
            onMouseDown={e => e.stopPropagation()}
            autoFocus />
          <div className="pe-link-row">
            <button className="pe-link-rm" onClick={() => { editor.chain().focus().unsetLink().run(); setOpen(false); }}>Remove</button>
            <button className="pe-link-apply" onClick={apply}>Apply</button>
          </div>
        </div>
      )}
    </span>
  );
};

// ---- Toolbar button ----
const Btn = ({ active, title, onClick, children, disabled }) => (
  <button
    className={"pe-btn" + (active ? " on" : "")}
    title={title}
    disabled={disabled}
    onMouseDown={e => { e.preventDefault(); onClick && onClick(); }}
  >{children}</button>
);

// ---- Separator ----
const Sep = () => <span className="pe-sep" />;

// ---- Block style dropdown ----
const BLOCK_OPTIONS = [
  { value: 'p',  label: 'Paragraph' },
  { value: 'h1', label: 'Heading 1' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
  { value: 'h4', label: 'Heading 4' },
];

// ---- Main editor component ----
const ProgramEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ horizontalRule: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: value || '',
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: { class: 'prog-editor-area', spellcheck: 'false' },
    },
  });

  // Sync content when value changes from outside (undo/redo)
  const lastValueRef = useRef(value);
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (value !== lastValueRef.current) {
      lastValueRef.current = value;
      if (editor.getHTML() !== value) {
        editor.commands.setContent(value || '', false);
      }
    }
  }, [value, editor]);

  if (!editor) return <div className="prog-editor-loading">Loading editor…</div>;

  const blockValue = BLOCK_OPTIONS.find(o => {
    if (o.value === 'p') return editor.isActive('paragraph');
    const lvl = parseInt(o.value.charAt(1));
    return editor.isActive('heading', { level: lvl });
  })?.value || 'p';

  const setBlock = (val) => {
    if (val === 'p') editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level: parseInt(val.charAt(1)) }).run();
  };

  const insertIntermission = () => {
    editor.chain().focus().setHorizontalRule().run();
  };

  return (
    <div className="prog-editor">
      {/* Toolbar */}
      <div className="pe-toolbar" onMouseDown={e => e.preventDefault()}>
        {/* Undo / redo */}
        <Btn title="Undo (⌘Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><IcoUndo /></Btn>
        <Btn title="Redo (⌘⇧Z)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><IcoRedo /></Btn>
        <Sep />

        {/* Block style */}
        <select className="pe-block-select" value={blockValue}
          onChange={e => setBlock(e.target.value)}
          onMouseDown={e => e.stopPropagation()}>
          {BLOCK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Sep />

        {/* Inline formatting */}
        <Btn active={editor.isActive('bold')} title="Bold (⌘B)" onClick={() => editor.chain().focus().toggleBold().run()}><b style={{fontFamily:'serif',fontSize:14}}>B</b></Btn>
        <Btn active={editor.isActive('italic')} title="Italic (⌘I)" onClick={() => editor.chain().focus().toggleItalic().run()}><i style={{fontFamily:'serif',fontSize:14}}>I</i></Btn>
        <Btn active={editor.isActive('underline')} title="Underline (⌘U)" onClick={() => editor.chain().focus().toggleUnderline().run()}><u style={{fontFamily:'serif',fontSize:13}}>U</u></Btn>
        <Btn active={editor.isActive('strike')} title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()}><s style={{fontFamily:'serif',fontSize:13}}>S</s></Btn>
        <Sep />

        {/* Colour */}
        <ColorFlyout label="Text color"
          onSelect={hex => editor.chain().focus().setColor(hex).run()}
          onClear={() => editor.chain().focus().unsetColor().run()}
          clearLabel="Default" />
        <ColorFlyout label="Highlight"
          onSelect={hex => editor.chain().focus().toggleHighlight({ color: hex }).run()}
          onClear={() => editor.chain().focus().unsetHighlight().run()}
          clearLabel="None" />
        <Sep />

        {/* Link */}
        <LinkPopover editor={editor} />
        <Sep />

        {/* Alignment */}
        <Btn active={editor.isActive({ textAlign: 'left' })} title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()}><IcoAlignL /></Btn>
        <Btn active={editor.isActive({ textAlign: 'center' })} title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()}><IcoAlignC /></Btn>
        <Btn active={editor.isActive({ textAlign: 'right' })} title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()}><IcoAlignR /></Btn>
        <Btn active={editor.isActive({ textAlign: 'justify' })} title="Justify" onClick={() => editor.chain().focus().setTextAlign('justify').run()}><IcoAlignJ /></Btn>
        <Sep />

        {/* Lists */}
        <Btn active={editor.isActive('bulletList')} title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()}><IcoListBullet /></Btn>
        <Btn active={editor.isActive('orderedList')} title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()}><IcoListNum /></Btn>
        <Btn title="Outdent" onClick={() => editor.chain().focus().liftListItem('listItem').run()}><IcoOutdent /></Btn>
        <Btn title="Indent" onClick={() => editor.chain().focus().sinkListItem('listItem').run()}><IcoIndent /></Btn>
        <Sep />

        {/* Intermission divider */}
        <Btn title="Insert intermission divider" onClick={insertIntermission}><IcoHr /></Btn>
        <Sep />

        {/* Clear formatting */}
        <Btn title="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}><IcoClear /></Btn>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} className="prog-editor-wrap" />
    </div>
  );
};

// Convert legacy pieces array to HTML for first-time migration
const piecesToHtml = (pieces) => {
  if (!pieces || !pieces.length) return '';
  const esc = (s) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return pieces.map(p => {
    if (p.kind === 'intermission') return '<hr>';
    const parts = [];
    if (p.composer) parts.push(`<h2>${esc(p.composer)}</h2>`);
    if (p.work) parts.push(`<p><strong>${esc(p.work)}</strong></p>`);
    if (p.meta) parts.push(`<p><em>${esc(p.meta)}</em></p>`);
    (p.movements || []).forEach(m => { if (m) parts.push(`<p>${esc(m)}</p>`); });
    return parts.join('');
  }).join('');
};

export { ProgramEditor, piecesToHtml };
