import { ElectionRepository } from '@/Repository/ElectionRepository';
import { CivicService } from './CivicService';
import { RegionService } from './RegionService';
import type { County, Town } from '@/Model/RegionModel';
import type { BallotResult, IdentityScenario, ProfileId } from '@/Model/ElectionModel';
export const ElectionService = {
  getRules: ElectionRepository.get,
  indigenousSourceIds() {
    const guide = ElectionRepository.get().indigenousGuide;
    return [
      ...new Set([
        ...guide.sharedBallots.flatMap((item) => item.sourceIds),
        ...guide.comparisons.flatMap((item) => item.sourceIds),
        ...guide.geography.sourceIds,
        ...guide.polling.sourceIds,
        ...guide.councils.takeaways.flatMap((item) => item.sourceIds),
        ...guide.councils.snapshot.sourceIds,
        ...guide.councils.questions.flatMap((item) => item.sourceIds),
      ]),
    ];
  },
  autonomousDistricts() {
    return RegionService.get().counties.flatMap((county) =>
      county.towns.filter((town) => town.autonomous).map((town) => county.name + town.name),
    );
  },
  profile(county: County, town: Town): ProfileId {
    if (town.autonomous) return 'indigenous-district';
    if (county.type === 'municipality') return 'municipality-district';
    if (county.type === 'city') return 'city-district';
    return town.type === 'city'
      ? 'county-city'
      : town.type === 'town'
        ? 'county-town'
        : 'county-township';
  },
  lookup(
    countyId: string,
    townId: string,
    identity: IdentityScenario = 'unspecified',
  ): BallotResult {
    const match = RegionService.resolve(countyId, townId);
    if (!match) throw new Error('請重新選擇有效的戶籍縣市與鄉鎮市區。');
    const rules = ElectionRepository.get();
    const profileId = ElectionService.profile(match.county, match.town);
    const profile = rules.localProfiles.find((p) => p.id === profileId);
    if (!profile) throw new Error('這個地區的規則尚未完成查核，請參考選委會資料。');
    const replace = (value: string) =>
      value.replaceAll('{county}', match.county.name).replaceAll('{town}', match.town.name);
    const national = rules.national.map((b) => {
      const ballot = { ...b, role: CivicService.getRole(b.roleId) };
      if (b.id !== 'legislator') return ballot;
      const labels = {
        general: '區域立法委員',
        plains: '平地原住民立法委員',
        mountain: '山地原住民立法委員',
        unspecified: '區域或原住民立委（依資格擇一類）',
      };
      return {
        ...ballot,
        title: labels[identity],
        summary:
          identity === 'unspecified'
            ? '一般選民投區域立委；具相應資格者投平地或山地原住民立委，兩者不重複領取。'
            : `${labels[identity]}是候選人票的其中一類，不會因此另外增加一張區域立委票。`,
      };
    });
    return {
      location: match.county.name + match.town.name,
      profileId,
      profileLabel: profile.label,
      national,
      local: profile.ballots.map((b) => ({
        ...b,
        title: replace(b.title),
        summary: replace(b.summary),
        role: CivicService.getRole(b.roleId),
        electionNote:
          b.id === 'county-council'
            ? rules.indigenousGuide.localNotes.countyCouncil[identity]
            : b.id === 'town-council'
              ? rules.indigenousGuide.localNotes.townCouncil[identity]
              : b.id === 'indigenous-council'
                ? rules.indigenousGuide.localNotes.autonomousCouncil
                : undefined,
      })),
      identitySummary: rules.indigenousGuide.scenarioSummaries[identity],
      checkedAt: rules.checkedAt,
      sourceIds: rules.sourceIds,
      notice: rules.notice,
      stale:
        Date.now() - Date.parse(rules.checkedAt) > 90 * 24 * 60 * 60 * 1000 ||
        Date.now() - Date.parse(RegionService.get().checkedAt) > 90 * 24 * 60 * 60 * 1000,
    };
  },
};
