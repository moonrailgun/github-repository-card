import {
  CustomError,
  logger,
  MissingParamError,
  request,
  wrapTextMultiline,
} from './common';
import { retryer } from './retryer';
import { AxiosRequestHeaders } from 'axios';

const GRAPHQL_REPO_QUERY = `
query repoInfo($owner: String!, $name: String!,) {
  repository(owner: $owner, name: $name) {
    stargazerCount
    collaborators {
      totalCount
    }
    languages(first: 1) {
      nodes {
        name
      }
    }
    createdAt
  }
}
`;

/**
 * Stats fetcher object.
 *
 * @param {import('axios').AxiosRequestHeaders} variables Fetcher variables.
 * @param {string} token GitHub token.
 * @returns {Promise<import('../common/types').Fetcher>} Stats fetcher response.
 */
const fetcher = async (variables: AxiosRequestHeaders, token: string) => {
  const query = GRAPHQL_REPO_QUERY;
  const res = await request(
    {
      query,
      variables,
    },
    {
      Authorization: `bearer ${token}`,
    }
  );

  console.log('res', res);

  return res;
};

/**
 * Fetch stats for a given username.
 *
 * @param username GitHub username.
 * @param include_all_commits Include all commits.
 * @returns Stats data.
 */
export async function fetchStats(repo: string) {
  if (!repo) {
    throw new MissingParamError(['repo']);
  }

  const info = {
    name: '',
    totalPRs: 0,
    totalReviews: 0,
    totalCommits: 0,
    totalIssues: 0,
    totalStars: 0,
    totalDiscussionsStarted: 0,
    totalDiscussionsAnswered: 0,
    contributedTo: 0,
    rank: { level: 'C', percentile: 100 },
  };

  let res = await statsFetcher(repo);

  // Catch GraphQL errors.
  if (res.data.errors) {
    logger.error(res.data.errors);
    if (res.data.errors[0].type === 'NOT_FOUND') {
      throw new CustomError(
        res.data.errors[0].message || 'Could not fetch user.',
        CustomError.USER_NOT_FOUND
      );
    }
    if (res.data.errors[0].message) {
      throw new CustomError(
        wrapTextMultiline(res.data.errors[0].message, 90, 1)[0],
        res.statusText
      );
    }
    throw new CustomError(
      'Something went wrong while trying to retrieve the stats data using the GraphQL API.',
      CustomError.GRAPHQL_ERROR
    );
  }

  return res;
}

/**
 * Fetch stats information for a given username.
 *
 * @param {string} username Github username.
 * @returns {Promise<import('../common/types').StatsFetcher>} GraphQL Stats object.
 *
 * @description This function supports multi-page fetching if the 'FETCH_MULTI_PAGE_STARS' environment variable is set to true.
 */
const statsFetcher = async (repoFullname: string) => {
  const [owner, name] = repoFullname.split('/');
  const variables: any = { owner, name };
  let res = await retryer(fetcher, variables);

  return res;
};
