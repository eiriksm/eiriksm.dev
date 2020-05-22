import React, { useState, useEffect } from 'react'
import blogFormat from "../date"
import clone from "lodash.clone"
const emoji = require("node-emoji")
const util = require('util');

var remark = require('remark')
var html = require('remark-html')
function Comments({ comments, issueId }) {
  const [commentList, setCommentList] = useState(false);
  comments = comments.filter(comment => {
    return comment.message && comment.message.length > 0
  })

  useEffect(() => {

    const renderComments = async() => {
      let commentListJobs = comments.map(async comment => {
        let date = blogFormat(comment.createdAt.getTime())
        if (!comment.author.name) {
          comment.author.name = "Anonymous"
        }
        let fullDate = comment.createdAt.toString()
        let body = clone(comment.message)
        body = emoji.emojify(body)
        // Also markdownify this thing.
        var promise = util.promisify(remark()
          .use(html)
          .process)
        body = await promise(body)
        return (
          <div key={comment.commentId} className="my-2 border-b-2">
            <p className="text-xs">
              {comment.author.name}
              <span className="mx-1 text-xs">&bull;</span>
              <span className="text-gray-600" title={fullDate}>
                {date}
              </span>
            </p>
            <div className="text-gray-700 leading-normal text-xs p-2">
              <div dangerouslySetInnerHTML={{ __html: body }}></div>
            </div>
          </div>
        )
      })
      var commentList = await Promise.all(commentListJobs)
      setCommentList(commentList)
    }

    if (commentList === false) {
      renderComments()
    }
    else {
      if (comments.length !== commentList.length) {
        //setCommentList(false)
      }
    }
  }, [commentList, comments]);

  let commentInfo
  let commentListComponents
  if (commentList === false) {
    let commentCopy = clone(comments)
    commentListComponents = commentCopy.map(comment => {
      let date = blogFormat(comment.createdAt.getTime())
      if (!comment.author.name) {
        comment.author.name = "Anonymous"
      }
      let fullDate = comment.createdAt.toString()
      let body = clone(comment.message)
      body = body.replace(/(\r\n)/g, "<br>")
      body = body.replace(/(\n)/g, "<br>")
      body = emoji.emojify(body)
      return (
        <div key={comment.commentId} className="my-2 border-b-2">
          <p className="text-xs">
            {comment.author.name}
            <span className="mx-1 text-xs">&bull;</span>
            <span className="text-gray-600" title={fullDate}>
              {date}
            </span>
          </p>
          <div className="text-gray-700 leading-normal text-xs p-2">
            <div dangerouslySetInnerHTML={{ __html: body }}></div>
          </div>
        </div>
      )
    })
  }
  else {
    commentListComponents = commentList
  }
  let commentCount = commentListComponents.length + ""
  let commentWord = "comments"
  if (commentCount === "1") {
    commentWord = "comment"
  }

  if (commentCount === "0") {
    commentWord += " 😿"
  }
  commentCount = commentCount.padStart(2, "0")
  if (issueId) {
    commentInfo = (
      <div className="comment-link-wrapper">
        <p>Do you want to comment?</p>
        <p className="text-sm">
          This article uses github for commenting. To comment, you can visit{" "}
          <a
            href={
              "https://github.com/eiriksm/eiriksm.dev-comments/issues/" +
              issueId
            }
          >
            https://github.com/eiriksm/eiriksm.dev-comments/issues/{issueId}
          </a>
          .
        </p>
      </div>
    )
  }
  return (
    <div className="comment-wrapper border-t-2 my-2 py-1">
      <div className="comment-header border-b-2 py-2 uppercase font-bold">
        <span className="count bg-blue-800 text-white rounded text-lg p-1 font-mono">
          {commentCount}
        </span>
        <span> </span>
        {commentWord}
      </div>
      {commentListComponents}
      {commentInfo}
    </div>
  )
}

Comments.defaultProps = {
  comments: [],
  issueId: null,
}

export default Comments
