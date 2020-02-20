import React from "react"
import blogFormat from '../date'

function Comments({ comments, issueId }) {
  comments = comments.filter(comment => {
    return comment.message && comment.message.length > 0
  })
  let commentList = comments.map(comment => {
    let date = blogFormat(comment.createdAt.getTime())
    if (!comment.author.name) {
      comment.author.name = 'Anonymous'
    }
    return (
      <div key={comment.commentId} className="eading-normal my-2 border-b-2">
        <p className="text-xs">{comment.author.name} <span className="mx-1 text-xs">&bull;</span> <span className="text-gray-600">{date}</span></p>
        <div className="text-gray-700 leading-normal text-xs p-2">
          <div dangerouslySetInnerHTML={{ __html: comment.message }}></div>
        </div>
      </div>
    )
  })
  let commentCount = comments.length + ''
  let commentWord = 'comments'
  if (commentCount === 1) {
    commentWord = 'comment'
  }

  if (commentCount === '0') {
    commentWord += ' 😿'
  }
  commentCount = commentCount.padStart(2, '0')
  let commentInfo;
  if (issueId) {
    commentInfo = (<div className="">
    <p>Do you want to comment?</p>
    <p className="text-sm">This article uses github for commenting. To comment, you can visit <a href={'https://github.com/eiriksm/eiriksm.dev-comments/issues/'+issueId}>https://github.com/eiriksm/eiriksm.dev-comments/issues/{issueId}
      </a>.</p>
  </div>)
  }
  return (
      <div className="comment-wrapper border-t-2 my-2 py-1">
        <div className="comment-header border-b-2 py-2 uppercase font-bold">
          <span className="count bg-blue-800 text-white rounded text-lg p-1 font-mono">{commentCount}</span><span> </span>
          {commentWord}
        </div>
        {commentList}
        {commentInfo}
      </div>
  )
}

Comments.defaultProps = {
  comments: [],
  issueId: null
}

export default Comments
