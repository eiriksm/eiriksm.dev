import React from "react"
import { graphql } from "gatsby"
import Layout from "./layout"
import Teaser from "./node-teaser"

export default ({ data }) => {
  const posts = data.allNodeArticle.edges

  const list = posts.map((item) => {
      return (
          <Teaser key={item.node.id} node={item.node}></Teaser>
      )
  })
  return (
    <Layout>
      <div>
        {list}
      </div>
    </Layout>
  )
}

export const query = graphql`
  query($skip: Int!, $limit: Int!) {
      allNodeArticle(
        sort: {fields: created, order: DESC}
        limit: $limit
        skip: $skip
      ) {
        edges {
          node {
            title
            id
            path {
              alias
            }
            body {
              value
            }
            relationships {
              field_tags {
                name
                id
                drupal_internal__tid
              }
              field_image {
                localFile {
                  publicURL
                }
              }
            }
            created
          }
        }
      }
    }
`
