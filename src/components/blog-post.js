import React from "react"
import { useEffect } from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import blogFormat from "../date"
import Prism from "prismjs"

export default ({ data }) => {
  useEffect(() => {
    // call the highlightAll() function to style our code blocks
    Prism.highlightAll()
  })
  const post = data.nodeArticle
  let img;
  if (post.relationships.field_image) {
      img = (<img alt={post.title} className="blog-illustration" src={ post.relationships.field_image.localFile.publicURL } />)
  }
  let serverRendered = (<span data-property="is-server-rendered"></span>)
  if (typeof window !== `undefined`) {
    serverRendered = '';
  }
  return (
    <Layout>
      <article>
        {serverRendered}
        <h1 id="page-title">{ post.title }</h1>
        <small className="blog-date text-gray-700 py-1">{ blogFormat(new Date(post.created * 1000)) }</small>
        <div className="article-body" dangerouslySetInnerHTML={{ __html: post.body.value }}></div>
        {img}
      </article>
    </Layout>
  )
}

export const query = graphql`
  query($id: String!) {
    nodeArticle(id: { eq: $id }) {
      title
      body {
        value
      }
      created
      relationships {
        field_image {
          localFile {
            publicURL
          }
        }
      }
    }
  }
`