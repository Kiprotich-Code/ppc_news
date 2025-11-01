import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const articleId = url.searchParams.get('id');
  
  if (!articleId) {
    return NextResponse.json({ error: "Article ID required" }, { status: 400 });
  }

  try {
    const article = await prisma.article.findUnique({
      where: { 
        id: articleId, 
        publishedStatus: "PUBLISHED" 
      },
      include: {
        author: { 
          select: { name: true } 
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Generate the same URLs as the metadata
    const articleUrl = `${process.env.NEXTAUTH_URL || 'https://paypost.co.ke'}/feed/${articleId}`;
    
    let imageUrl;
    if (article.featuredImage) {
      if (article.featuredImage.startsWith('http')) {
        imageUrl = article.featuredImage;
      } else {
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? (process.env.NEXTAUTH_URL || 'https://paypost.co.ke')
          : 'https://paypost.co.ke';
        imageUrl = article.featuredImage.startsWith('/') 
          ? `${baseUrl}${article.featuredImage}`
          : `${baseUrl}/${article.featuredImage}`;
      }
    } else {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? (process.env.NEXTAUTH_URL || 'https://paypost.co.ke')
        : 'https://paypost.co.ke';
      imageUrl = `${baseUrl}/logo.jpeg`;
    }

    return NextResponse.json({
      articleId,
      title: article.title,
      featuredImage: article.featuredImage,
      generatedImageUrl: imageUrl,
      articleUrl,
      nodeEnv: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
    });

  } catch (error) {
    console.error("Error checking metadata:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
