import TextArea from '../../TextArea'

export default function HTMLForm ({ meta, setMeta }) {
  return (
    <TextArea
      placeholder='HTML'
      name='html'
      onChange={(e, { value }) => setMeta({ ...meta, html: value })}
      value={meta?.html}
    />
  )
}
