import React from "react"
import Tags from "./tags"
import { Link } from "gatsby"
import blogFormat from '../date'

function Teaser({ node }) {
  let pagePath = node.path.alias
  if (!pagePath) {
    pagePath = '/node/' + node.drupal_internal__nid
  }
  let date = blogFormat(new Date(node.created * 1000))
  let serverRendered = (<span data-property="is-server-rendered"></span>)
  if (typeof window !== `undefined`) {
    serverRendered = '';
  }
  return (
    <article className="node node--view-mode-teaser pb-8 clearfix" about="/aa-cc" typeof="schema:Article">
        {serverRendered}
        <div className="node__meta text-sm text-gray-700 py-1">{date}</div>
        <h2 className="node__title ">
            <Link to={ pagePath }>{ node.title }</Link>
        </h2>
        <div className="read-more uppercase">
        <Link className="no-underline text-base font-bold" to={ pagePath }>Read more</Link>
        </div>
        <div className="comment-count"><a data-disqus-identifier={pagePath} href={pagePath}></a></div>
        <Tags tags={node.relationships.field_tags}></Tags>
    </article>
  )
}

Teaser.defaultProps = {
  node: {}
}

export default Teaser
