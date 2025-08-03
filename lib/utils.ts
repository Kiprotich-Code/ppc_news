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
export function tiptapToHtml(content: string): string {
  try {
    // Parse the JSON content
    const tiptapData = JSON.parse(content);
    
    // If it's already HTML, return as is
    if (typeof tiptapData === 'string' && tiptapData.startsWith('<')) {
      return tiptapData;
    }
    
    // Convert TipTap JSON to HTML
    if (tiptapData.type === 'doc' && tiptapData.content) {
      return convertTiptapNodeToHtml(tiptapData);
    }
    
    // If it's not valid TipTap JSON, return as plain text
    return content;
  } catch (error) {
    // If parsing fails, return as plain text
    return content;
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
            text = `<a href="${mark.attrs?.href || '#'}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            break;
          case 'code':
            text = `<code>${text}</code>`;
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
  
  switch (node.type) {
    case 'paragraph':
      tag = 'p';
      break;
    case 'heading':
      const level = node.attrs?.level || 1;
      tag = `h${level}`;
      break;
    case 'bulletList':
      tag = 'ul';
      break;
    case 'orderedList':
      tag = 'ol';
      break;
    case 'listItem':
      tag = 'li';
      break;
    case 'blockquote':
      tag = 'blockquote';
      break;
    case 'codeBlock':
      tag = 'pre';
      html = `<code>${node.content?.[0]?.text || ''}</code>`;
      break;
    case 'horizontalRule':
      return '<hr>';
    case 'image':
      const src = node.attrs?.src || '';
      const alt = node.attrs?.alt || '';
      const caption = node.attrs?.caption || '';
      html = `<figure class="image-container"><img src="${src}" alt="${alt}" class="image-content" />`;
      if (caption) {
        html += `<figcaption class="image-caption">${caption}</figcaption>`;
      }
      html += '</figure>';
      return html;
    case 'video':
      const videoSrc = node.attrs?.src || '';
      const videoTitle = node.attrs?.title || '';
      const videoCaption = node.attrs?.caption || '';
      html = `<div class="video-embed"><iframe src="${videoSrc}" title="${videoTitle}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen="true" frameborder="0" style="width:100%;min-height:320px;"></iframe>`;
      if (videoCaption) {
        html += `<div class="caption">${videoCaption}</div>`;
      }
      html += '</div>';
      return html;
  }
  
  // Process child nodes
  if (node.content && Array.isArray(node.content)) {
    html += node.content.map((child: any) => convertTiptapNodeToHtml(child)).join('');
  }
  
  // Handle text alignment
  if (node.attrs?.textAlign) {
    attributes += ` style="text-align: ${node.attrs.textAlign};"`;
  }
  
  return `<${tag}${attributes}>${html}</${tag}>`;
}