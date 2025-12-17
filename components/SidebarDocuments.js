import Image from 'next/image'

export default function SidebarDocuments ({ documents }) {
  if (!documents?.length) return null

  const basePath = process.env.BASE_PATH || ''

  return (
    <div className='grid grid-cols-3 gap-2'>
      {documents.map(doc => (
        <a
          key={doc.id}
          href={`${basePath}/api/documents/${doc.id}`}
          target='_blank'
          rel='noopener noreferrer'
          className='block aspect-square rounded-lg overflow-hidden bg-primary-900 hover:ring-2 hover:ring-accent-500 transition-all relative'
        >
          <Image
            src={`${basePath}/api/documents/${doc.id}`}
            alt='Document'
            fill
            className='object-cover'
            unoptimized
          />
        </a>
      ))}
    </div>
  )
}
