export default function HTML ({ meta }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: meta.html
      }}
    />
  )
}
