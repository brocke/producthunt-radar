// GraphQL queries for the ProductHunt API.
// See plan.md §6 for the source cheatsheet.

import { gql } from "graphql-request";

export const TODAY_POSTS = gql`
  query TodayPosts($postedAfter: DateTime!) {
    posts(first: 20, order: VOTES, postedAfter: $postedAfter) {
      edges {
        node {
          id
          slug
          name
          tagline
          votesCount
          commentsCount
          createdAt
          featuredAt
          thumbnail { url }
          topics(first: 5) {
            edges { node { id name slug } }
          }
        }
      }
    }
  }
`;
