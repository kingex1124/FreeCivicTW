import { SiteRepository } from '@/Repository/SiteRepository';
import { SiteConfig } from '@/Config/SiteConfig';
export const SiteService = {
  get: SiteRepository.get,
  copyEmail: SiteRepository.copyEmail,
  routePath(pathname: string) {
    return SiteConfig.basePath && pathname.startsWith(SiteConfig.basePath + '/')
      ? pathname.slice(SiteConfig.basePath.length)
      : pathname;
  },
  readMotion: SiteRepository.readMotion,
  saveMotion: SiteRepository.saveMotion,
  asset(path: string) {
    return `${SiteConfig.basePath}${path.startsWith('/') ? path : `/${path}`}`;
  },
  absolute(path = '/') {
    return `${SiteConfig.origin}${SiteService.asset(path)}`;
  },
  correctionLink(path: string) {
    const site = SiteRepository.get();
    return `${site.contact.mailto}?subject=${encodeURIComponent(site.contact.correctionSubject)}&body=${encodeURIComponent(`頁面：${SiteService.absolute(path)}\n\n疑似問題：\n\n建議修正與參考來源：\n`)}`;
  },
};
