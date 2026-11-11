import articles from '@data/articles.json';
import paths from '@data/learning-paths.json';
import { ArticlesSchema, PathsSchema } from '@/Model/LearningModel';
const content = ArticlesSchema.parse(articles);
const planning = PathsSchema.parse(paths);
export const LearningRepository = {
  getArticles: () => content.articles,
  getPaths: () => planning.paths,
  getModules: () => planning.modules,
};
