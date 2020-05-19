import React from "react"
import { graphql } from "gatsby"
import Layout from "./layout"
import Teaser from "./node-teaser"
import SEO from "../components/seo"
import { Link } from "gatsby"

export default ({ data, pageContext }) => {
  const posts = data.allNodeArticle.edges
  const { currentPage, numPages } = pageContext
  const isFirst = currentPage === 1
  const isLast = currentPage === numPages
  const prevPage =
    currentPage - 1 === 1 ? "/" : "/blog/" + (currentPage - 1).toString()
  const nextPage = "/blog/" + (currentPage + 1).toString()

  const list = posts.map(item => {
    return <Teaser key={item.node.id} node={item.node}></Teaser>
  })
  return (
    <Layout>
      <SEO title="Blog" />
      <div>{list}</div>
      <div className="blog-pager">
        {!isFirst && (
          <Link to={prevPage} rel="prev">
            ← Previous Page
          </Link>
        )}
        {!isLast && (
          <Link to={nextPage} rel="next">
            Next Page →
          </Link>
        )}
      </div>
    </Layout>
  )
}

export const query = graphql`
  query($skip: Int!, $limit: Int!) {
    allNodeArticle(
      sort: { fields: created, order: DESC }
      limit: $limit
      skip: $skip
    ) {
      edges {
        node {
          title
          drupal_internal__nid
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
