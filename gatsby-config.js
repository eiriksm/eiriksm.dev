module.exports = {
  siteMetadata: {
    title: `eiriksm.dev`,
    siteUrl: 'https://eiriksm.dev',
    description: `eiriksm.dev: Drupal blog for eiriksm.`,
    author: `@orkj`,
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
    `gatsby-plugin-offline`,
    {
      resolve: `gatsby-source-drupal`,
      options: {
        baseUrl: `http://api.orkjern.com/`,
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
        printRejected: true, // Print removed selectors and processed file names
        // develop: true, // Enable while using `gatsby develop`
        tailwind: true, // Enable tailwindcss support
        whitelist: ['#gatsby-noscript'], // Don't remove this selector
        ignore: ['/ignored.css', 'prismjs/', 'docsearch.js/'], // Ignore files/folders
        // purgeOnly : ['components/', '/main.css', 'bootstrap/'], // Purge only these files/folders
      }
    },
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
                  description: edge.node.excerpt,
                  date: edge.node.created,
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
            title: "eiriksm.dev Planet Drupal feed"
          },
        ],
      },
    },
  ],
}
