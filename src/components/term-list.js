import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import Teaser from "./node-teaser"

export default ({ data }) => {
  const posts = data.allNodeArticle.edges

  const list = posts.map(item => {
    return <Teaser key={item.node.id} node={item.node}></Teaser>
  })
  return (
    <Layout>
      <div className="term-list">{list}</div>
    </Layout>
  )
}

export const query = graphql`
  query($id: String!) {
    allNodeArticle(
      sort: { fields: created, order: DESC }
      filter: {
        relationships: { field_tags: { elemMatch: { id: { eq: $id } } } }
      }
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
