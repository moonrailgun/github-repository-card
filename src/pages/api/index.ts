// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {
  clampValue,
  CONSTANTS,
  logger,
  parseArray,
  parseBoolean,
  parseString,
  renderError,
} from '@/utils/common';
import { fetchStats } from '@/utils/fetchers';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { repo, cache_seconds } = req.query;
  res.setHeader('Content-Type', 'image/svg+xml');

  try {
    const stats = await fetchStats(parseString(repo));

    let cacheSeconds = clampValue(
      parseInt(
        cache_seconds ? String(cache_seconds) : String(CONSTANTS.FOUR_HOURS),
        10
      ),
      CONSTANTS.FOUR_HOURS,
      CONSTANTS.ONE_DAY
    );
    cacheSeconds = process.env.CACHE_SECONDS
      ? parseInt(process.env.CACHE_SECONDS, 10) || cacheSeconds
      : cacheSeconds;

    res.setHeader(
      'Cache-Control',
      `max-age=${
        cacheSeconds / 2
      }, s-maxage=${cacheSeconds}, stale-while-revalidate=${CONSTANTS.ONE_DAY}`
    );

    return res.json(stats);

    // return res.send(renderRepoCard(stats));
  } catch (err: any) {
    logger.error(err);
    res.setHeader('Cache-Control', `no-cache, no-store, must-revalidate`); // Don't cache error responses.
    res.send(renderError(String(err.message), String(err.secondaryMessage)));
  }
}
