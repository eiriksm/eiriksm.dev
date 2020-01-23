const path = require(`path`)
const util = require('util')

exports.createPages = async({ graphql, actions }) => {
  const { createPage } = actions
  const result = await graphql(`
  {
    allNodeArticle(sort: {fields: created, order: DESC}) {
      edges {
        node {
          title
          created
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
      path: i === 0 ? `/blog` : `/blog/${i + 1}`,
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