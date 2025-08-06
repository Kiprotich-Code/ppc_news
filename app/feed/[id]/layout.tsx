import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const article = await prisma.article.findUnique({
      where: { 
        id, 
        publishedStatus: "PUBLISHED" 
      },
      include: {
        author: { 
          select: { name: true } 
        },
      },
    });

    if (!article) {
      return {
        title: "Article Not Found - PayPost.co.ke",
        description: "The requested article could not be found on PayPost.co.ke",
      };
    }

    // Extract text content from TipTap JSON for description
    let description = "Read this article on PayPost.co.ke";
    try {
      const contentObj = JSON.parse(article.content);
      if (contentObj?.content) {
        // Extract text from the first paragraph or text node
        const extractText = (nodes: any[]): string => {
          let text = "";
          for (const node of nodes) {
            if (node.type === "text") {
              text += node.text;
            } else if (node.content) {
              text += extractText(node.content);
            }
            if (text.length > 100) break;
          }
          return text;
        };
        
        const textContent = extractText(contentObj.content);
        if (textContent) {
          description = textContent.substring(0, 160) + (textContent.length > 160 ? "..." : "");
        }
      }
    } catch (e) {
      // If parsing fails, use default description
    }

    const articleUrl = `${process.env.NEXTAUTH_URL || 'https://paypost.co.ke'}/feed/${id}`;
    
    // Handle both absolute URLs (Vercel Blob) and relative paths (local uploads)
    let imageUrl;
    if (article.featuredImage) {
      if (article.featuredImage.startsWith('http')) {
        // Already an absolute URL (e.g., Vercel Blob) - use as is
        imageUrl = article.featuredImage;
      } else {
        // Relative path - for development, use a placeholder or skip relative images
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? (process.env.NEXTAUTH_URL || 'https://paypost.co.ke')
          : 'https://paypost.co.ke'; // Use production URL even in development for social sharing
        imageUrl = article.featuredImage.startsWith('/') 
          ? `${baseUrl}${article.featuredImage}`
          : `${baseUrl}/${article.featuredImage}`;
      }
    } else {
      // Fallback to logo
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? (process.env.NEXTAUTH_URL || 'https://paypost.co.ke')
        : 'https://paypost.co.ke';
      imageUrl = `${baseUrl}/logo.jpeg`;
    }

    console.log('Generated metadata for article:', {
      id,
      title: article.title,
      imageUrl,
      articleUrl
    });

    return {
      title: `${article.title} - PayPost.co.ke`,
      description,
      openGraph: {
        title: article.title,
        description,
        url: articleUrl,
        siteName: "PayPost.co.ke",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: article.title,
            type: 'image/jpeg',
          },
        ],
        type: "article",
        publishedTime: article.publishedAt?.toISOString(),
        authors: [article.author?.name || "PayPost Writer"],
        locale: 'en_US',
      },
      twitter: {
        card: "summary_large_image",
        title: article.title,
        description,
        images: [imageUrl],
        site: "@paypost",
        creator: `@${article.author?.name || "paypost"}`,
      },
      alternates: {
        canonical: articleUrl,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "PayPost.co.ke - Read Latest Articles",
      description: "Discover and read the latest articles on PayPost.co.ke",
    };
  }
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
