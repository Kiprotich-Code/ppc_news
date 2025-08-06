export const ARTICLE_CATEGORIES = [
  { id: 'jobs', name: 'Jobs', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'politics', name: 'Politics', color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'entertainment', name: 'Entertainment', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'agriculture', name: 'Agriculture', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'sports', name: 'Sports', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'fashion-beauty', name: 'Fashion & Beauty', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { id: 'lifestyle', name: 'Lifestyle', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'relationship', name: 'Relationship', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  { id: 'society', name: 'Society', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { id: 'education', name: 'Education', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'business', name: 'Business', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'travel', name: 'Travel', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { id: 'technology', name: 'Technology', color: 'bg-slate-100 text-slate-800 border-slate-200' },
] as const

export type ArticleCategory = typeof ARTICLE_CATEGORIES[number]['id']

export const getCategoryConfig = (categoryId: string) => {
  return ARTICLE_CATEGORIES.find(cat => cat.id === categoryId) || ARTICLE_CATEGORIES[0]
}
