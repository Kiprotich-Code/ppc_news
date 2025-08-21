import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(amount);
}

/**
 * Converts TipTap JSON content to HTML
 */
export function tiptapToHtml(content: string, className?: string): string {
  try {
    // Parse the JSON content
    const tiptapData = JSON.parse(content);
    
    // If it's already HTML, return as is
    if (typeof tiptapData === 'string' && tiptapData.startsWith('<')) {
      return tiptapData;
    }
    
    // Convert TipTap JSON to HTML
    if (tiptapData.type === 'doc' && tiptapData.content) {
      const htmlContent = convertTiptapNodeToHtml(tiptapData);
      
      // Only wrap with prose if no className is provided (for full content rendering)
      if (!className) {
        return `<div class="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">${htmlContent}</div>`;
      }
      
      // For custom className, just return the content
      return htmlContent;
    }
    
    // If it's not valid TipTap JSON, return as plain text
    const fallbackContent = `<p>${content}</p>`;
    
    if (!className) {
      return `<div class="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">${fallbackContent}</div>`;
    }
    
    return fallbackContent;
  } catch (error) {
    // If parsing fails, return as plain text
    const fallbackContent = `<p>${content}</p>`;
    
    if (!className) {
      return `<div class="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">${fallbackContent}</div>`;
    }
    
    return fallbackContent;
  }
}

function convertTiptapNodeToHtml(node: any): string {
  if (typeof node === 'string') {
    return node;
  }
  
  if (!node || typeof node !== 'object') {
    return '';
  }
  
  // Handle text nodes
  if (node.type === 'text') {
    let text = node.text || '';
    
    // Apply marks (bold, italic, etc.)
    if (node.marks) {
      node.marks.forEach((mark: any) => {
        switch (mark.type) {
          case 'bold':
            text = `<strong>${text}</strong>`;
            break;
          case 'italic':
            text = `<em>${text}</em>`;
            break;
          case 'underline':
            text = `<u>${text}</u>`;
            break;
          case 'strike':
            text = `<s>${text}</s>`;
            break;
          case 'link':
            const href = mark.attrs?.href || '#';
            text = `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${text}</a>`;
            break;
          case 'code':
            text = `<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">${text}</code>`;
            break;
        }
      });
    }
    
    return text;
  }
  
  // Handle block nodes
  let html = '';
  let tag = 'div';
  let attributes = '';
  let cssClass = '';
  
  switch (node.type) {
    case 'doc':
      // Just process content for document nodes
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((child: any) => convertTiptapNodeToHtml(child)).join('');
      }
      return '';
      
    case 'paragraph':
      tag = 'p';
      cssClass = 'mb-4';
      break;
      
    case 'heading':
      const level = node.attrs?.level || 1;
      tag = `h${level}`;
      cssClass = level === 1 ? 'text-3xl font-bold mb-6' :
                 level === 2 ? 'text-2xl font-semibold mb-4' :
                 'text-xl font-semibold mb-3';
      break;
      
    case 'bulletList':
      tag = 'ul';
      cssClass = 'list-disc pl-6 mb-4 space-y-2';
      break;
      
    case 'orderedList':
      tag = 'ol';
      cssClass = 'list-decimal pl-6 mb-4 space-y-2';
      break;
      
    case 'listItem':
      tag = 'li';
      cssClass = 'mb-1';
      break;
      
    case 'blockquote':
      tag = 'blockquote';
      cssClass = 'border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4';
      break;
      
    case 'codeBlock':
      tag = 'pre';
      cssClass = 'bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4';
      const code = node.content?.[0]?.text || '';
      html = `<code class="text-sm">${code}</code>`;
      break;
      
    case 'horizontalRule':
      return '<hr class="border-gray-300 my-6">';
      
    case 'image':
      const src = node.attrs?.src || '';
      const alt = node.attrs?.alt || '';
      const caption = node.attrs?.caption || '';
      html = `<figure class="image-container mb-4">
        <img 
          src="${src}" 
          alt="${alt}" 
          class="image-content rounded-lg max-w-full h-auto mx-auto" 
          style="max-height: 400px; object-fit: contain;"
        />`;
      if (caption) {
        html += `<figcaption class="text-sm text-gray-600 mt-2 text-center italic">${caption}</figcaption>`;
      }
      html += '</figure>';
      return html;
      
    case 'video':
      const videoSrc = node.attrs?.src || '';
      const videoTitle = node.attrs?.title || '';
      const videoCaption = node.attrs?.caption || '';
      html = `<div class="video-embed mb-4">
        <iframe 
          src="${videoSrc}" 
          title="${videoTitle}" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen="true" 
          frameborder="0" 
          style="width:100%;min-height:320px;border-radius:8px;"
        ></iframe>`;
      if (videoCaption) {
        html += `<div class="text-sm text-gray-600 mt-2 text-center italic">${videoCaption}</div>`;
      }
      html += '</div>';
      return html;
      
    default:
      // Handle unknown node types
      tag = 'div';
      break;
  }
  
  // Process child nodes
  if (node.content && Array.isArray(node.content)) {
    html += node.content.map((child: any) => convertTiptapNodeToHtml(child)).join('');
  }
  
  // Handle text alignment
  let style = '';
  if (node.attrs?.textAlign) {
    style += `text-align: ${node.attrs.textAlign};`;
  }
  
  // Build attributes string
  if (cssClass) {
    attributes += ` class="${cssClass}"`;
  }
  if (style) {
    attributes += ` style="${style}"`;
  }
  
  return `<${tag}${attributes}>${html}</${tag}>`;
}

/**
 * Utility function to extract plain text from TipTap content
 */
export function extractTextFromTipTap(content: string): string {
  if (!content) return ""
  
  try {
    const parsedContent = JSON.parse(content)
    
    function extractText(node: any): string {
      if (node.type === 'text') {
        return node.text || ''
      }
      
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join('')
      }
      
      // Add space after block elements for better readability
      if (node.type === 'paragraph' || node.type === 'heading') {
        return node.content ? node.content.map(extractText).join('') + ' ' : ''
      }
      
      return ''
    }
    
    if (parsedContent.content && Array.isArray(parsedContent.content)) {
      return parsedContent.content.map(extractText).join('').trim()
    }
    
    return ''
  } catch (e) {
    // Return as-is if not JSON, but clean up any HTML tags
    return content.replace(/<[^>]*>/g, '').trim()
  }
}

/**
 * Utility function to check if content is TipTap JSON
 */
export function isTipTapContent(content: string): boolean {
  if (!content) return false
  
  try {
    const parsed = JSON.parse(content)
    return parsed.type && parsed.content !== undefined
  } catch (e) {
    return false
  }
}