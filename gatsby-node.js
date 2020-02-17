const path = require(`path`)
const util = require('util')
const fetch = require('node-fetch')

exports.createPages = async({ graphql, actions }) => {
  const { createPage } = actions
  const result = await graphql(`
  {
    allNodeArticle(sort: {fields: created, order: DESC}) {
      edges {
        node {
          title
          created
          drupal_id
          drupal_internal__nid
          id
          body {
            value
          }
          path {
            alias
          }
        }
      }
    }
  }
  `)
  const posts = result.data.allNodeArticle.edges
  const postsPerPage = 10
  const numPages = Math.ceil(posts.length / postsPerPage)
  Array.from({ length: numPages }).forEach((_, i) => {
    createPage({
      path: i === 0 ? '/' : `/blog/${i + 1}`,
      component: path.resolve("./src/components/blog-list.js"),
      context: {
        limit: postsPerPage,
        skip: i * postsPerPage,
        numPages,
        currentPage: i + 1,
      },
    })
  })
  result.data.allNodeArticle.edges.forEach(({ node }) => {
    let pagePath = node.path.alias
    if (!pagePath) {
      pagePath = '/node/' + node.drupal_internal__nid
    }
    createPage({
      path: pagePath,
      component: path.resolve(`./src/components/blog-post.js`),
      context: {
        id: node.id,
        drupal_id: node.drupal_id
      },
    })
  })
  const termResult = await graphql(`
  {
    allTaxonomyTermTags {
      edges {
        node {
          id
          name
          drupal_internal__tid
        }
      }
    }
  }

  `)
  termResult.data.allTaxonomyTermTags.edges.forEach(({ node }) => {
    let pagePath = util.format('/taxonomy/term/%d', node.drupal_internal__tid)
    createPage({
      path: pagePath,
      component: path.resolve(`./src/components/term-list.js`),
      context: {
        id: node.id,
      },
    })
  })
}

exports.onCreateWebpackConfig = ({
  stage,
  rules,
  loaders,
  plugins,
  actions,
}) => {
  actions.setWebpackConfig({
    module: {
      rules: [
        {
          test: /\.css$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'postcss-loader'
            }
          ]
        }
      ]
    }
  })
}

exports.sourceNodes = async({ actions, createNodeId, createContentDigest }) => {
  const { createNode } = actions
  try {
    const login = process.env.BASIC_AUTH_USERNAME
    const password = process.env.BASIC_AUTH_PASSWORD
    let data = await fetch(process.env.API_URL + 'jsonapi/node/article', {
      headers: new fetch.Headers({
        "Authorization": `Basic ${new Buffer(`${login}:${password}`).toString('base64')}`
      })
    })
    let json = await data.json()
    let jobs = json.data.map(async (drupalNode) => {
        if (!drupalNode.attributes.field_issue_comment_id) {
          return
        }
        let drupalNodeId = drupalNode.attributes.field_issue_comment_id
        let myData = {
          drupalId: drupalNode.id,
          issueId: drupalNodeId,
          comments: []
        }
        let url = `https://www.drupal.org/api-d7/comment.json?node=${drupalNodeId}&sort=created&direction=ASC`
        let drupalData = await fetch(url)
        let drupalJson = await drupalData.json()
        myData.comments = drupalJson.list
        let nodeMeta = {
          id: createNodeId(`drupal-org-comments-${myData.drupalId}`),
          parent: null,
          mediaType: "application/json",
          children: [],
          internal: {
            type: `drupal__org__comment`,
            content: JSON.stringify(myData),
            contentDigest: createContentDigest(myData)
          }
        }
        let node = Object.assign({}, myData, nodeMeta)
        node.internal.contentDigest = createContentDigest(node)
        createNode(node)
      }
    )
    await Promise.all(jobs)
  }
  catch (err) {
    throw err
  }
}
