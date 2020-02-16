import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"
import blogFormat from "../date"
import Prism from "prismjs"
import Comments from "./comments"

export default class BlogPost extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showImage: (typeof window === `undefined`)
    }
  }
  componentDidMount() {
    // call the highlightAll() function to style our code blocks
    Prism.highlightAll()
  }
  handleImageClick() {
    this.setState({showImage: true})
  }
  render()  {
    let comments = []
    if (this.props.data.allDisqusThread.edges && this.props.data.allDisqusThread.edges[0].node.comments) {
      comments = this.props.data.allDisqusThread.edges[0].node.comments
    }
    let data = this.props.data
    const post = data.nodeArticle
    let url = post.path.alias
    if (!url) {
      url = '/node/' + post.drupal_internal__nid
    }
    let img
    if (post.relationships.field_image && post.relationships.field_image.localFile) {
      img = (
        <div className="img player"  onClick={this.handleImageClick.bind(this)}>
          <div className="text">Play</div>
        </div>
      )
      if (this.state.showImage) {
        img = (<img alt={post.title} className="blog-illustration" src={ post.relationships.field_image.localFile.publicURL} />)
      }
    }
    let serverRendered = (<span data-property="is-server-rendered"></span>)
    if (typeof window !== `undefined`) {
      serverRendered = '';
    }
    return (
      <Layout>
        <article className="full">
          <SEO title={post.title} />
          {serverRendered}
          <h1 id="page-title">{ post.title }</h1>
          <small className="blog-date text-gray-700 py-1">{ blogFormat(new Date(post.created * 1000)) }</small>
          <div className="article-body" dangerouslySetInnerHTML={{ __html: post.body.value }}></div>
          {img}
        </article>
        <Comments comments={comments} />
      </Layout>
    )
  }
}

export const query = graphql`
  query($id: String!) {
    nodeArticle(id: { eq: $id }) {
      title
      body {
        value
      }
      path {
        alias
      }
      drupal_internal__nid
      created
      relationships {
        field_image {
          localFile {
            publicURL
          }
        }
      }
    }
    allDisqusThread(
      filter: {threadId: { eq: $id }}
      ) {
      edges {
        node {
          id
          comments {
            author {
              username
              name
            }
            createdAt
            message
          }
          threadId
          link
        }
      }
    }
  }
`