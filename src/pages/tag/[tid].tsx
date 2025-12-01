import { GetStaticPaths, GetStaticProps } from "next"
import Head from "next/head"
import {
  drupal,
  ensureTagUuidMap,
  getAllResources,
} from "@/lib/drupal"
import { DrupalNode } from "next-drupal"
import BlogPostCard from "@/components/BlogPostCard"
import { DrupalJsonApiParams } from "drupal-jsonapi-params"

interface TagPageProps {
  term: any
  nodes: DrupalNode[]
}

export default function TagPage({ term, nodes }: TagPageProps) {
  return (
    <>
      <Head>
        <title>Posts tagged &quot;{term.name}&quot; | eiriksm.dev</title>
        <meta name="description" content={`All posts tagged with ${term.name}`} />
      </Head>

      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Posts tagged &quot;{term.name}&quot;
          </h1>
          <p className="text-gray-600 mt-2">
            {nodes.length} {nodes.length === 1 ? "post" : "posts"} found
          </p>
        </header>

        <div className="space-y-8">
          {nodes.map((node) => (
            <BlogPostCard key={node.id} node={node} />
          ))}
        </div>

        {nodes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No posts found with this tag.</p>
          </div>
        )}
      </div>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    console.log('[getStaticPaths] Fetching all tags...')

    const terms = await getAllResources<any>("taxonomy_term--tags")

    await ensureTagUuidMap(terms)

    const paths = terms.map((term: any) => ({
      params: {
        tid: term.drupal_internal__tid?.toString() || term.id,
      },
    }))

    console.log(`[getStaticPaths] Generated ${paths.length} tag paths`)

    return {
      paths,
      fallback: false,
    }
  } catch (error) {
    console.error('[getStaticPaths] Failed to generate tag paths:', error)
    return {
      paths: [],
      fallback: false,
    }
  }
}

export const getStaticProps: GetStaticProps<TagPageProps> = async ({ params }) => {
  const tid = params?.tid as string

  try {
    console.log(`[getStaticProps] Fetching tag ${tid}...`)

    const tagUuidMap = await ensureTagUuidMap()
    const tagId = tagUuidMap[tid] || tid

    const term = await drupal.getResource(
      "taxonomy_term--tags",
      tagId
    )

    if (!term) {
      return {
        notFound: true,
      }
    }

    // Fetch all articles
    const apiParams = new DrupalJsonApiParams()
    apiParams.addSort("created", "DESC")
    apiParams.addInclude(["field_tags"])

    const allNodes = await getAllResources<DrupalNode>(
      "node--article",
      apiParams
    )

    // Filter nodes that have this tag
    const nodes = allNodes.filter((node: any) => {
      return node.field_tags?.some((tag: any) => tag.drupal_internal__tid === parseInt(tid))
    })

    console.log(`[getStaticProps] Tag "${term.name}": ${nodes.length} posts`)

    return {
      props: {
        term,
        nodes,
      },
    }
  } catch (error) {
    console.error(`[getStaticProps] Failed to fetch tag ${tid}:`, error)
    return {
      notFound: true,
    }
  }
}
