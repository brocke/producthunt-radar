// Raw GraphQL types as returned by the ProductHunt API.
// Mirrors the queries in `./queries.ts` — keep in sync.

export type PHTopic = {
  id: string;
  name: string;
  slug: string;
};

export type PHThumbnail = {
  url: string;
};

export type PHPost = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  votesCount: number;
  commentsCount: number;
  createdAt: string;        // ISO 8601
  featuredAt: string | null;
  thumbnail: PHThumbnail | null;
  topics: {
    edges: Array<{ node: PHTopic }>;
  };
};

export type TodayPostsResponse = {
  posts: {
    edges: Array<{ node: PHPost }>;
  };
};
