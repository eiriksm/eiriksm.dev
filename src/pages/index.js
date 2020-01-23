import React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Teaser from "../components/node-teaser"

import { useStaticQuery, graphql } from "gatsby"

const IndexPage = () => {

  const data = useStaticQuery(graphql`
  {
    allNodeArticle(
      sort: {fields: created, order: DESC}
      limit: 10
    ) {
      edges {
        node {
          id
          title
          created
          drupal_internal__nid
          relationships {
            field_tags {
              name
              drupal_internal__tid
              id
            }
          }
          path {
            alias
          }
        }
      }
    }
  }  
  `)
  const blogs = data.allNodeArticle.edges.map(edge =>  {
    return (
      <Teaser key={edge.node.id} node={edge.node}></Teaser>
    )
  })

  return (
    <Layout>
      <SEO title="Home" />{blogs}
    </Layout>
  )
}

export default IndexPage
