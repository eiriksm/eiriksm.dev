import Head from "next/head"

export default function TalksPage() {
  return (
    <>
      <Head>
        <title>Talks | eiriksm.dev</title>
        <meta name="description" content="Conference talks and presentations by Eirik S. Morland" />
      </Head>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Talks & Presentations</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-700 leading-relaxed mb-6">
            A collection of my conference talks, presentations, and speaking engagements.
          </p>

          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">
              Talk listings coming soon...
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
