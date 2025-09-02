"use client"
import React, { useMemo, useState } from 'react'
import { createEditor, Descendant, Editor, Transforms } from 'slate'
import { Slate, Editable, withReact, ReactEditor } from 'slate-react'
import { withHistory } from 'slate-history'

// Define custom types for our content
type CustomElement = {
  type: 'paragraph' | 'heading' | 'list' | 'list-item' | 'image' | 'link' | 'callout' | 'quote'
  level?: number
  url?: string
  alt?: string
  children: CustomText[]
}

type CustomText = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
}

declare module 'slate' {
  interface CustomTypes {
    Editor: ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}

interface PlateEditorProps {
  initialValue?: Descendant[]
  onChange?: (value: Descendant[]) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: 'Start writing your content...' }],
  },
]

export default function PlateEditor({
  initialValue: propInitialValue,
  onChange,
  placeholder = 'Start writing...',
  readOnly = false,
  className = ''
}: PlateEditorProps) {
  const [value, setValue] = useState<Descendant[]>(propInitialValue || initialValue)
  
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])

  const handleChange = (newValue: Descendant[]) => {
    setValue(newValue)
    onChange?.(newValue)
  }

  // Custom rendering functions
  const renderElement = (props: any) => {
    const { attributes, children, element } = props
    
    switch (element.type) {
      case 'heading':
        const HeadingTag = `h${element.level || 2}` as keyof JSX.IntrinsicElements
        return (
          <HeadingTag 
            {...attributes} 
            className={`font-bold text-deep-blue mb-4 ${
              element.level === 1 ? 'text-3xl' :
              element.level === 2 ? 'text-2xl' :
              element.level === 3 ? 'text-xl' : 'text-lg'
            }`}
          >
            {children}
          </HeadingTag>
        )
      
      case 'list':
        return (
          <ul {...attributes} className="list-disc list-inside mb-4 text-charcoal">
            {children}
          </ul>
        )
      
      case 'list-item':
        return (
          <li {...attributes} className="mb-2">
            {children}
          </li>
        )
      
      case 'image':
        return (
          <div {...attributes} className="my-6">
            <img 
              src={element.url} 
              alt={element.alt || ''} 
              className="max-w-full h-auto rounded-lg shadow-sm border border-deep-blue-light"
            />
            {element.alt && (
              <p className="text-sm text-charcoal/70 mt-2 italic text-center">{element.alt}</p>
            )}
            {children}
          </div>
        )
      
      case 'link':
        return (
          <a 
            {...attributes} 
            href={element.url}
            className="text-deep-blue hover:text-deep-blue-hover underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        )
      
      case 'callout':
        return (
          <div {...attributes} className="bg-vibrant-orange-light border-l-4 border-vibrant-orange p-4 my-6 rounded-r-lg">
            <div className="text-vibrant-orange font-medium">
              {children}
            </div>
          </div>
        )
      
      case 'quote':
        return (
          <blockquote {...attributes} className="border-l-4 border-deep-blue-light pl-6 py-4 my-6 bg-deep-blue-light/30 rounded-r-lg">
            <div className="text-charcoal italic text-lg">
              {children}
            </div>
          </blockquote>
        )
      
      default:
        return (
          <p {...attributes} className="mb-4 text-charcoal leading-relaxed">
            {children}
          </p>
        )
    }
  }

  const renderLeaf = (props: any) => {
    const { attributes, children, leaf } = props
    
    let element = children
    
    if (leaf.bold) {
      element = <strong className="font-semibold">{element}</strong>
    }
    
    if (leaf.italic) {
      element = <em className="italic">{element}</em>
    }
    
    if (leaf.underline) {
      element = <u className="underline">{element}</u>
    }
    
    if (leaf.color) {
      element = <span style={{ color: leaf.color }}>{element}</span>
    }
    
    return <span {...attributes}>{element}</span>
  }

  // Toolbar functions
  const toggleFormat = (format: string) => {
    const isActive = isFormatActive(editor, format)
    
    if (isActive) {
      Editor.removeMark(editor, format)
    } else {
      Editor.addMark(editor, format, true)
    }
  }

  const toggleBlock = (format: string) => {
    const isActive = isBlockActive(editor, format)
    
    Transforms.setNodes(
      editor,
      { type: isActive ? 'paragraph' : format },
      { match: n => Editor.isBlock(editor, n) }
    )
  }

  const insertHeading = (level: number) => {
    Transforms.setNodes(
      editor,
      { type: 'heading', level },
      { match: n => Editor.isBlock(editor, n) }
    )
  }

  const insertCallout = () => {
    const callout: CustomElement = {
      type: 'callout',
      children: [{ text: 'Important information...' }],
    }
    Transforms.insertNodes(editor, callout)
  }

  const insertQuote = () => {
    const quote: CustomElement = {
      type: 'quote',
      children: [{ text: 'Quote text...' }],
    }
    Transforms.insertNodes(editor, quote)
  }

  return (
    <div className={`bg-white rounded-lg border border-deep-blue-light ${className}`}>
      {!readOnly && (
        <div className="border-b border-deep-blue-light p-4">
          <div className="flex flex-wrap gap-2">
            {/* Text Formatting */}
            <div className="flex gap-1 border-r border-deep-blue-light pr-3">
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  toggleFormat('bold')
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  isFormatActive(editor, 'bold')
                    ? 'bg-deep-blue text-white'
                    : 'bg-gray-100 text-charcoal hover:bg-gray-200'
                }`}
              >
                B
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  toggleFormat('italic')
                }}
                className={`px-3 py-1 rounded text-sm font-medium italic transition-colors ${
                  isFormatActive(editor, 'italic')
                    ? 'bg-deep-blue text-white'
                    : 'bg-gray-100 text-charcoal hover:bg-gray-200'
                }`}
              >
                I
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  toggleFormat('underline')
                }}
                className={`px-3 py-1 rounded text-sm font-medium underline transition-colors ${
                  isFormatActive(editor, 'underline')
                    ? 'bg-deep-blue text-white'
                    : 'bg-gray-100 text-charcoal hover:bg-gray-200'
                }`}
              >
                U
              </button>
            </div>

            {/* Headings */}
            <div className="flex gap-1 border-r border-deep-blue-light pr-3">
              {[1, 2, 3, 4].map((level) => (
                <button
                  key={level}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    insertHeading(level)
                  }}
                  className="px-3 py-1 rounded text-sm font-medium bg-gray-100 text-charcoal hover:bg-gray-200 transition-colors"
                >
                  H{level}
                </button>
              ))}
            </div>

            {/* Block Elements */}
            <div className="flex gap-1 border-r border-deep-blue-light pr-3">
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  toggleBlock('list')
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  isBlockActive(editor, 'list')
                    ? 'bg-deep-blue text-white'
                    : 'bg-gray-100 text-charcoal hover:bg-gray-200'
                }`}
              >
                • List
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertQuote()
                }}
                className="px-3 py-1 rounded text-sm font-medium bg-gray-100 text-charcoal hover:bg-gray-200 transition-colors"
              >
                " Quote
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertCallout()
                }}
                className="px-3 py-1 rounded text-sm font-medium bg-vibrant-orange-light text-vibrant-orange hover:bg-vibrant-orange hover:text-white transition-colors"
              >
                ⚠ Callout
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-6">
        <Slate editor={editor} initialValue={value} onChange={handleChange}>
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder={placeholder}
            readOnly={readOnly}
            className="min-h-[300px] focus:outline-none"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          />
        </Slate>
      </div>
    </div>
  )
}

// Helper functions
const isFormatActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format as keyof typeof marks] === true : false
}

const isBlockActive = (editor: Editor, format: string) => {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n => !Editor.isEditor(n) && Editor.isBlock(editor, n) && n.type === format,
    })
  )

  return !!match
}
