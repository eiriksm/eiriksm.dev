import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"
import blogFormat from "../date"
import Prism from "prismjs"
import Comments from "./comments"
import Tags from "./tags"
import parse from "date-fns/parse"

export default class BlogPost extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      comments: [],
      showImage: typeof window === `undefined`,
    }
  }
  componentDidMount() {
    // call the highlightAll() function to style our code blocks
    Prism.highlightAll()
    if (
      typeof window !== `undefined` &&
      this.props.data.nodeArticle.field_issue_comment_id
    ) {
      window
        .fetch(
          "https://api.github.com/repos/eiriksm/eiriksm.dev-comments/issues/" +
            this.props.data.nodeArticle.field_issue_comment_id +
            "/comments"
        )
        .then(async response => {
          let json = await response.json()
          let githubComments = this.createCommentsFromGithubList(json)
          githubComments = githubComments.filter(comment => {
            let haveIt = false
            this.state.comments.forEach(existing => {
              if (existing.cid === comment.cid) {
                haveIt = true
              }
            })
            return !haveIt
          })
          this.setState(state => {
            const comments = state.comments.concat(githubComments)
            return {
              comments,
            }
          })
        })
    }
  }
  createCommentsFromGithubList(comments) {
    return comments.map(comment => {
      comment.body = comment.body.replace(/(\r\n)/g, "<br>")
      return {
        createdAt: parse(
          comment.created_at + "+00",
          "uuuu-LL-dd'T'HH:mm:ss'Z'x",
          new Date()
        ),
        author: {
          name: comment.user.login,
        },
        cid: comment.id,
        commentId: "github-" + comment.id,
        message: comment.body,
      }
    })
  }
  handleImageClick() {
    this.setState({ showImage: true })
  }
  render() {
    if (typeof window !== `undefined`) {
      Prism.highlightAll()
    }
    var comments = this.state.comments
    if (
      this.props.data.allDisqusThread.edges &&
      this.props.data.allDisqusThread.edges[0] &&
      this.props.data.allDisqusThread.edges[0].node.comments
    ) {
      let disqusComments = this.props.data.allDisqusThread.edges[0].node
        .comments
      let commentsCorrect = disqusComments.map(comment => {
        if (typeof comment.createdAt.getMonth !== "function") {
          // Not already a date object.
          comment.createdAt = parse(
            comment.createdAt,
            "uuuu-LL-dd'T'HH:mm:ss'Z'",
            new Date()
          )
          comment.commentId = "disqus-" + comment.id
        }
        return comment
      })
      commentsCorrect = commentsCorrect.filter(comment => {
        let haveIt = false
        comments.forEach(existing => {
          if (existing.cid === comment.cid) {
            haveIt = true
          }
        })
        return !haveIt
      })
      commentsCorrect.forEach(comment => {
        comments.push(comment)
      })
    }
    let data = this.props.data
    if (
      data.allGithubComment &&
      data.allGithubComment.nodes &&
      data.allGithubComment.nodes[0] &&
      data.allGithubComment.nodes[0].comments
    ) {
      let gcomments = this.createCommentsFromGithubList(
        data.allGithubComment.nodes[0].comments
      )
      gcomments = gcomments.filter(comment => {
        let haveIt = false
        comments.forEach(existing => {
          if (existing.cid === comment.cid) {
            haveIt = true
          }
        })
        return !haveIt
      })

      gcomments.forEach(comment => {
        comments.push(comment)
      })
    }
    // Now, since these can actually vary, let's sort them by the created timestamp.
    comments.sort((a, b) => a.createdAt - b.createdAt)
    const post = data.nodeArticle
    let url = post.path.alias
    if (!url) {
      url = "/node/" + post.drupal_internal__nid
    }
    let img
    if (
      post.relationships.field_image &&
      post.relationships.field_image.localFile
    ) {
      img = (
        <div className="img player" onClick={this.handleImageClick.bind(this)}>
          <div className="text">Play</div>
        </div>
      )
      if (this.state.showImage) {
        img = (
          <img
            alt={post.title}
            className="blog-illustration"
            src={post.relationships.field_image.localFile.publicURL}
          />
        )
      }
    }
    let serverRendered = <span data-property="is-server-rendered"></span>
    if (typeof window !== `undefined`) {
      serverRendered = ""
    }
    let issueId = null
    if (this.props.data.nodeArticle.field_issue_comment_id) {
      issueId = this.props.data.nodeArticle.field_issue_comment_id
    }
    return (
      <Layout>
        <article className="full">
          <SEO title={post.title} />
          {serverRendered}
          <h1 id="page-title">{post.title}</h1>
          <small className="blog-date text-gray-700 py-1">
            {blogFormat(new Date(post.created * 1000))}
          </small>
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: post.body.value }}
          ></div>
          <div>{img}</div>
          <div>
            <Tags tags={post.relationships.field_tags}></Tags>
          </div>
        </article>
        <Comments comments={comments} issueId={issueId} />
      </Layout>
    )
  }
}

export const query = graphql`
  query($id: String!, $drupal_id: String!) {
    nodeArticle(id: { eq: $id }) {
      title
      field_issue_comment_id
      body {
        value
      }
      path {
        alias
      }
      drupal_internal__nid
      created
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
    }

    allDisqusThread(filter: { threadId: { eq: $id } }) {
      edges {
        node {
          id
          comments {
            author {
              username
              name
            }
            id
            createdAt
            message
          }
          threadId
          link
        }
      }
    }
    allGithubComment(filter: { drupalId: { eq: $drupal_id } }) {
      nodes {
        drupalId
        comments {
          body
          id
          created_at
          user {
            login
          }
        }
      }
    }
  }
`
