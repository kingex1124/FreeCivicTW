import { CivicRepository } from '@/Repository/CivicRepository';
import type { CivicData, Role, RelationFilter } from '@/Model/CivicModel';
const rolesForScope = (data: CivicData, scope: 'central' | 'local') =>
  data.roles.filter((r) =>
    r.scopes
      ? r.scopes.includes(scope)
      : scope === 'central'
        ? r.level === 'central'
        : r.level !== 'central',
  );
export const CivicService = {
  get: CivicRepository.get,
  getRole: (id: string) => CivicRepository.get().roles.find((r) => r.id === id),
  related: (
    data: CivicData,
    id: string,
    kind: RelationFilter = 'all',
    scope?: 'central' | 'local',
  ) => {
    const scopeIds = scope ? new Set(rolesForScope(data, scope).map((role) => role.id)) : undefined;
    return data.relations
      .filter(
        (r) =>
          (r.from === id || r.to === id) &&
          (kind === 'all' || r.kind === kind) &&
          (!scopeIds || (scopeIds.has(r.from) && scopeIds.has(r.to))),
      )
      .map((r) => {
        const officeCatalog = data.appointmentCatalogs.find((c) => c.id === r.officeCatalogId);
        return {
          ...r,
          fromName: r.fromLabel ?? data.roles.find((role) => role.id === r.from)?.name ?? r.from,
          toName: r.toLabel ?? data.roles.find((role) => role.id === r.to)?.name ?? r.to,
          offices: officeCatalog?.offices ?? [],
          officeCatalog,
        };
      });
  },
  forScope: rolesForScope,
  name: (roles: Role[], id: string) => roles.find((r) => r.id === id)?.name ?? id,
};
