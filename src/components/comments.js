import React from "react"
import blogFormat from '../date'

function Comments({ comments }) {
  comments = comments.filter(comment => {
    return comment.message && comment.message.length > 0
  })
  let commentList = comments.map(comment => {
    let date = blogFormat(comment.createdAt.getTime())
    if (!comment.author.name) {
      comment.author.name = 'Anonymous'
    }
    return (
      <div key={comment.commentId} className="text-grey-dark leading-normal py-2">
        <div className="text-grey-darkest leading-normal">
          <div dangerouslySetInnerHTML={{ __html: comment.message }}></div>
        </div>
        <p className="text-sm">{comment.author.name} <span className="mx-1 text-xs">&bull;</span> <span className="text-gray-600">{date}</span></p>
      </div>
    )
  })
  let commentCount = comments.length
  let commentWord = 'comments'
  if (commentCount === 1) {
    commentWord = 'comment'
  }
  return (
      <div className="comment-wrapper">
        {commentCount} {commentWord}
        {commentList}
      </div>
  )
}

Comments.defaultProps = {
  comments: []
}

export default Comments
