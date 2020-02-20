import React from "react"
const util = require('util')

function Tags({ tags }) {
  const tagList = tags.map((tag) => {
      let path = util.format('/taxonomy/term/%d', tag.drupal_internal__tid)
      return (
          <li key={tag.id}>
              <a className="mr-2 border-2 p-2 py-1 mb-1" href={path}>
              {tag.name}
              </a>
          </li>
      )
  })
  return (
        <div className="clearfix field-type-taxonomy-term-reference">
            <ul className="links field-items">
                {tagList}
            </ul>
        </div>
  )
}

Tags.defaultProps = {
  tags: []
}

export default Tags
