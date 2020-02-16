import React from "react"
import blogFormat from '../date'
import parse from 'date-fns/parse'

function Comments({ comments }) {
  comments = comments.filter(comment => {
    return comment.message && comment.message.length > 0
  })
  let commentList = comments.map(comment => {
    let dateobj = parse(comment.createdAt, "uuuu-LL-dd'T'HH:mm:ss'Z'", new Date())
    let date = blogFormat(dateobj)
    if (!comment.author.name) {
      comment.author.name = 'Anonymous'
    }
    return (
      <div className="text-grey-dark leading-normal py-2">
        <p className="text-grey-darkest leading-normal">
          <div dangerouslySetInnerHTML={{ __html: comment.message }}></div>
        </p>
        <p className="text-sm">{comment.author.name} <span className="mx-1 text-xs">&bull;</span> <soan className="text-gray-600">{date}</soan></p>
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
