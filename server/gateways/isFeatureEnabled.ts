import type { Feature } from '#enumerators/feature';
import { SystemModel } from '#models/system';

export default async function isFeatureEnabled(feature: Feature) {
  const system = await SystemModel.exists({ features: feature });

  return Boolean(system);
}
