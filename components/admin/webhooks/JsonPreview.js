import fillTemplate from 'es6-dynamic-template'

export default function DiscordPreview ({ json, variables }) {
  if (!json) return null

  let content = json

  if (variables) {
    content = fillTemplate(json, variables)
  }

  try {
    content = JSON.parse(content)
  } catch (e) {
    return <div className='text-red-500'>Invalid JSON</div>
  }

  return (
    <pre>{JSON.stringify(content, null, 2)}</pre>
  )
}
