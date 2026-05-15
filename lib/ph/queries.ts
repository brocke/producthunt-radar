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

export const NEWEST_POSTS = gql`
  query NewestPosts($postedAfter: DateTime!) {
    posts(first: 20, order: NEWEST, postedAfter: $postedAfter) {
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

export const SNAPSHOT_POSTS = gql`
  query SnapshotPosts($postedAfter: DateTime!) {
    posts(first: 50, order: VOTES, postedAfter: $postedAfter) {
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

export const POST_DETAILS = gql`
  query PostDetails($slug: String!) {
    post(slug: $slug) {
      id
      slug
      name
      tagline
      description
      website
      url
      votesCount
      commentsCount
      createdAt
      featuredAt
      thumbnail { url }
      topics(first: 5) {
        edges { node { id name slug } }
      }
      makers { id name username }
      comments(first: 10, order: VOTES_COUNT) {
        edges {
          node {
            id
            body
            votesCount
            createdAt
            user { name username }
          }
        }
      }
    }
  }
`;
