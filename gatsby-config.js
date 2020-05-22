require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})

module.exports = {
  siteMetadata: {
    title: `eiriksm.dev`,
    siteUrl: 'https://eiriksm.dev',
    description: `eiriksm.dev: Drupal blog for eiriksm.`,
    author: `@orkj`,
    issueBase: process.env.ISSUE_BASE ? process.env.ISSUE_BASE : 'https://api.github.com/repos/eiriksm/eiriksm.dev-comments/issues/'
  },
  plugins: [
    `gatsby-plugin-postcss`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `eiriksm.dev`,
        short_name: `eiriksm`,
        start_url: `/`,
        background_color: `#718096`,
        theme_color: `#718096`,
        display: `minimal-ui`,
        icon: `src/images/d8.png`,
      },
    },
    {
      resolve: `gatsby-source-drupal`,
      options: {
        baseUrl: process.env.API_URL,
        basicAuth: {
          username: process.env.BASIC_AUTH_USERNAME,
          password: process.env.BASIC_AUTH_PASSWORD,
        },
      },
    },
    {
      resolve: `gatsby-plugin-s3`,
      options: {
        bucketName: "eiriksm.dev",
      },
    },
    {
      resolve: `gatsby-plugin-purgecss`,
      options: {
        printRejected: true,
        develop: true,
        tailwind: true,
        whitelist: ['#gatsby-noscript', 'blockquote', 'ul', 'li', 'h3', 'pre'],
        ignore: ['/ignored.css', 'prismjs/', 'docsearch.js/']
      }
    },
    `gatsby-plugin-sitemap`,
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { site, allNodeArticle } }) => {
              return allNodeArticle.edges.map(edge => {
                let pagePath = edge.node.path.alias
                if (!pagePath) {
                  pagePath = '/node/' + edge.node.drupal_internal__nid
                }
                return Object.assign({}, {
                  title: edge.node.title,
                  description: edge.node.excerpt,
                  date: new Date(edge.node.created * 1000),
                  url: site.siteMetadata.siteUrl + pagePath,
                  guid: site.siteMetadata.siteUrl + pagePath,
                  custom_elements: [{ "content:encoded": edge.node.body.value }],
                })
              })
            },
            query: `
            {
              allNodeArticle(
                sort: {fields: created, order: DESC}
              ) {
                edges {
                  node {
                    id
                    title
                    created
                    body {
                      value
                    }
                    drupal_internal__nid
                    relationships {
                      field_tags {
                        name
                        drupal_internal__tid
                        id
                      }
                    }
                    path {
                      alias
                    }
                  }
                }
              }
            }
            `,
            output: "/planet",
            title: "eiriksm.dev Planet Drupal feed",
            site_url: "https://eiriksm.dev",
          },
        ],
      },
    },
    'gatsby-plugin-robots-txt',
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: "UA-24128769-2",
        head: false,
        anonymize: true,
        respectDNT: true,
        exclude: [],
        pageTransitionDelay: 0,
      },
    },
    {
      resolve: `gatsby-source-disqus-xml`,
      options: {
        filePath: "disqus.xml"
      },
    },
  ],
}
