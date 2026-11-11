import { SourceRepository } from '@/Repository/SourceRepository';
export const SourceService = {
  get: SourceRepository.get,
  resolve(ids: string[]) {
    return ids.map((id) => {
      const source = SourceRepository.get().sources.find((s) => s.id === id);
      if (!source) throw new Error(`缺少來源：${id}`);
      return source;
    });
  },
};
